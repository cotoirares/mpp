import WebSocket from 'ws';
import { Server } from 'http';
import { DataService } from './data.service';
import { Player } from '../types/player';

// Extend WebSocket type to include isAlive property
interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
}

export class WebSocketService {
  private wss: WebSocket.Server;
  private clients: Set<ExtendedWebSocket> = new Set();
  private dataService: DataService;
  private generationInterval: NodeJS.Timeout | null = null;
  private generationRate: number = 5000; // Generate new player every 5 seconds

  constructor(server: Server) {
    // Initialize WebSocket server with proper configuration
    this.wss = new WebSocket.Server({ 
      server,
      // Add permissive settings for development
      verifyClient: (info, cb) => {
        // In production, you would want to verify the origin
        // For development, we'll accept all connections
        cb(true);
      }
    });
    
    this.dataService = DataService.getInstance();
    
    console.log('WebSocket server initialized');
    
    this.setupWebSocket();
    this.startDataGeneration();
  }

  private setupWebSocket() {
    this.wss.on('connection', async (ws: WebSocket, req: any) => {
      const extendedWs = ws as ExtendedWebSocket;
      const clientIp = req.socket.remoteAddress;
      console.log(`New WebSocket client connected from ${clientIp}`);
      this.clients.add(extendedWs);

      // Set up ping-pong to detect dead connections
      extendedWs.isAlive = true;
      extendedWs.on('pong', () => {
        extendedWs.isAlive = true;
      });

      try {
        // Send initial data
        const players = await this.dataService.getAllPlayers({});
        const stats = await this.dataService.getStatistics();
        
        const initialData = {
          type: 'initial',
          data: {
            players: players.slice(0, 20), // Just send first 20 players for initial load
            stats
          }
        };
        
        // Only send if the connection is still open
        if (extendedWs.readyState === WebSocket.OPEN) {
          extendedWs.send(JSON.stringify(initialData));
          console.log('Initial data sent to client');
        }
      } catch (error) {
        console.error('Error sending initial data:', error);
      }

      // Handle messages from client
      extendedWs.on('message', async (message: string) => {
        try {
          console.log('Received message from client:', message.toString().substring(0, 100));
          const data = JSON.parse(message.toString());
          
          // Handle commands from client
          if (data.type === 'command') {
            switch (data.command) {
              case 'changeGenerationRate':
                this.setGenerationRate(data.value);
                console.log(`Changed generation rate to ${data.value}ms`);
                break;
              case 'generatePlayers':
                const count = data.count || 1;
                console.log(`Generating ${count} players on demand`);
                await this.generateMultiplePlayers(count);
                break;
            }
          }
        } catch (error) {
          console.error('Error processing client message:', error);
        }
      });

      extendedWs.on('close', (code: number, reason: string) => {
        console.log(`WebSocket client disconnected. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
        this.clients.delete(extendedWs);
      });

      extendedWs.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(extendedWs);
      });
    });

    // Set up interval to check for dead connections
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const extendedWs = ws as ExtendedWebSocket;
        if (extendedWs.isAlive === false) {
          return extendedWs.terminate();
        }
        
        extendedWs.isAlive = false;
        extendedWs.ping(() => {});
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  private async generateMultiplePlayers(count: number) {
    const max = Math.min(count, 10); // Limit to 10 players at once
    const newPlayers: Player[] = [];
    
    for (let i = 0; i < max; i++) {
      try {
        const player = await this.dataService.generateNewPlayer();
        newPlayers.push(player);
      } catch (error) {
        console.error('Error generating player:', error);
      }
    }
    
    if (newPlayers.length > 0) {
      const stats = await this.dataService.getStatistics();
      
      this.broadcast({
        type: 'bulkUpdate',
        data: {
          newPlayers,
          stats
        }
      });
      console.log(`Generated and broadcast ${newPlayers.length} new players`);
    }
  }

  private setGenerationRate(milliseconds: number) {
    // Validate input (minimum 1 second, maximum 1 minute)
    const rate = Math.max(1000, Math.min(60000, milliseconds));
    this.generationRate = rate;
    
    // Restart generation with new rate
    if (this.generationInterval) {
      clearInterval(this.generationInterval);
    }
    this.startDataGeneration();
    
    // Inform all clients of the rate change
    this.broadcast({
      type: 'rateChanged',
      data: {
        generationRate: this.generationRate
      }
    });
  }

  private startDataGeneration() {
    // Clear existing interval if any
    if (this.generationInterval) {
      clearInterval(this.generationInterval);
    }
    
    console.log(`Starting player generation at rate of ${this.generationRate}ms`);
    
    this.generationInterval = setInterval(async () => {
      try {
        if (this.clients.size === 0) {
          return; // No clients connected, skip generation
        }
        
        // Generate a new player
        const newPlayer = await this.dataService.generateNewPlayer();
        console.log(`Generated new player: ${newPlayer.name}`);
        
        // Get updated stats
        const stats = await this.dataService.getStatistics();

        // Broadcast to all connected clients
        this.broadcast({
          type: 'update',
          data: {
            newPlayer,
            stats
          }
        });
      } catch (error) {
        console.error('Error generating data:', error);
      }
    }, this.generationRate);
  }

  private broadcast(message: any) {
    if (this.clients.size === 0) {
      return; // No clients to broadcast to
    }
    
    const data = JSON.stringify(message);
    let successCount = 0;
    let failCount = 0;
    
    this.clients.forEach(client => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
          successCount++;
        } else {
          // Client not ready, might be closing or connecting
          failCount++;
        }
      } catch (error) {
        console.error('Error sending message to client:', error);
        failCount++;
      }
    });
    
    console.log(`Broadcast stats: ${successCount} successful, ${failCount} failed`);
  }
} 