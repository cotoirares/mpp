import { type Player } from '~/types/player';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

type WebSocketMessage = {
  type: 'initial' | 'update' | 'bulkUpdate' | 'rateChanged';
  data: {
    players?: Player[];
    newPlayer?: Player;
    newPlayers?: Player[];
    stats?: {
      totalPlayers: number;
      averageAge: number;
      averageRank: number;
      averageHeight: number;
      totalGrandSlams: number;
      rightHanded: number;
      leftHanded: number;
      countryStats: Record<string, number>;
      ageStats: Array<{ range: string; count: number }>;
      grandSlamStats: Array<{ range: string; count: number }>;
      handStats: Record<string, number>;
    };
    generationRate?: number;
  };
};

type WebSocketCallbacks = {
  onInitialData?: (data: { players: Player[]; stats: WebSocketMessage['data']['stats'] }) => void;
  onNewPlayer?: (player: Player) => void;
  onBulkUpdate?: (players: Player[]) => void;
  onStatsUpdate?: (stats: WebSocketMessage['data']['stats']) => void;
  onRateChanged?: (rate: number) => void;
  onConnectionChange?: (isConnected: boolean) => void;
};

class WebSocketClient {
  private static instance: WebSocketClient;
  private ws: WebSocket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // Start with 2 seconds
  private backendPort = 3001;

  private constructor() {
    // Only attempt to connect if in browser environment
    if (isBrowser) {
      this.connect();
    }
  }

  public static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  private getWebSocketUrl(): string {
    if (!isBrowser) return ''; // Safety check
    
    // Use dynamic protocol based on the current page protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.hostname}:${this.backendPort}`;
  }

  private connect() {
    // Don't attempt to connect on server-side
    if (!isBrowser) return;
    
    try {
      // Close existing connection if there is one
      if (this.ws) {
        this.ws.onclose = null; // Prevent the reconnect logic on intentional close
        this.ws.close();
      }

      const wsUrl = this.getWebSocketUrl();
      console.log(`Attempting WebSocket connection to: ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        this.notifyConnectionChange(true);
        
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'initial':
              if (message.data.players && message.data.stats && this.callbacks.onInitialData) {
                this.callbacks.onInitialData({
                  players: message.data.players,
                  stats: message.data.stats
                });
              }
              if (message.data.stats && this.callbacks.onStatsUpdate) {
                this.callbacks.onStatsUpdate(message.data.stats);
              }
              break;
            case 'update':
              if (message.data.newPlayer && this.callbacks.onNewPlayer) {
                this.callbacks.onNewPlayer(message.data.newPlayer);
              }
              if (message.data.stats && this.callbacks.onStatsUpdate) {
                this.callbacks.onStatsUpdate(message.data.stats);
              }
              break;
            case 'bulkUpdate':
              if (message.data.newPlayers && this.callbacks.onBulkUpdate) {
                this.callbacks.onBulkUpdate(message.data.newPlayers);
              }
              if (message.data.stats && this.callbacks.onStatsUpdate) {
                this.callbacks.onStatsUpdate(message.data.stats);
              }
              break;
            case 'rateChanged':
              if (message.data.generationRate !== undefined && this.callbacks.onRateChanged) {
                this.callbacks.onRateChanged(message.data.generationRate);
              }
              break;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        this.isConnected = false;
        this.notifyConnectionChange(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        this.notifyConnectionChange(false);
        // Don't schedule reconnect here, we'll let onclose handle it
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    // Don't attempt to reconnect on server-side
    if (!isBrowser) return;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      // Exponential backoff: increases delay with each failed attempt
      const delay = Math.min(30000, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts));
      this.reconnectAttempts++;
      
      console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      // Use global setTimeout instead of window.setTimeout
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, delay);
    } else {
      console.error(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
    }
  }

  private notifyConnectionChange(isConnected: boolean) {
    if (this.callbacks.onConnectionChange) {
      this.callbacks.onConnectionChange(isConnected);
    }
  }

  public subscribe(callbacks: WebSocketCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    
    // If we're already connected, immediately notify
    if (this.isConnected && callbacks.onConnectionChange) {
      callbacks.onConnectionChange(true);
    }
    
    return () => this.unsubscribe();
  }

  public unsubscribe() {
    this.callbacks = {};
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  public forceReconnect() {
    if (!isBrowser) return;
    
    this.reconnectAttempts = 0; // Reset the counter
    this.connect(); // Force a new connection
  }

  public sendCommand(command: string, value?: any) {
    if (!isBrowser) return;
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'command',
        command,
        value
      }));
    } else {
      console.warn('Cannot send command: WebSocket not connected');
    }
  }

  public generatePlayers(count: number) {
    this.sendCommand('generatePlayers', count);
  }

  public setGenerationRate(milliseconds: number) {
    this.sendCommand('changeGenerationRate', milliseconds);
  }
}

// Export singleton instance
export const websocket = typeof window !== 'undefined' 
  ? WebSocketClient.getInstance()
  : ({} as WebSocketClient); // Provide a safe empty object on server-side 