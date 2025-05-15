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

// Mock static data for charts
const MOCK_STATS = {
  totalPlayers: 150,
  averageAge: 27.4,
  averageRank: 78.2,
  averageHeight: 185.6,
  totalGrandSlams: 42,
  rightHanded: 120,
  leftHanded: 30,
  countryStats: {
    'USA': 30,
    'Spain': 25,
    'France': 20,
    'Germany': 18,
    'UK': 15,
    'Russia': 12,
    'Argentina': 10,
    'Italy': 8,
    'Australia': 7,
    'Switzerland': 5
  },
  ageStats: [
    { range: '18-22', count: 32 },
    { range: '23-27', count: 48 },
    { range: '28-32', count: 37 },
    { range: '33-37', count: 25 },
    { range: '38+', count: 8 }
  ],
  grandSlamStats: [
    { range: '0', count: 130 },
    { range: '1-2', count: 12 },
    { range: '3-5', count: 5 },
    { range: '6-10', count: 2 },
    { range: '10+', count: 1 }
  ],
  handStats: {
    'Right': 120,
    'Left': 30
  }
};

class WebSocketClient {
  private static instance: WebSocketClient;
  private callbacks: WebSocketCallbacks = {};
  private isConnected = true; // Always show as connected
  private generationRate = 5000;
  private mockPlayers: Player[] = [];

  private constructor() {
    // Instead of connecting to WebSocket, simulate being connected with mock data
    if (isBrowser) {
      setTimeout(() => {
        this.simulateConnection();
      }, 1000);
    }
  }

  public static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  private simulateConnection() {
    console.log('Mock WebSocket initialized');
    this.isConnected = true;
    
    // Notify connected status
    if (this.callbacks.onConnectionChange) {
      this.callbacks.onConnectionChange(true);
    }
    
    // Send initial mock data
    if (this.callbacks.onInitialData) {
      this.callbacks.onInitialData({
        players: this.mockPlayers,
        stats: MOCK_STATS
      });
    }
    
    if (this.callbacks.onStatsUpdate) {
      this.callbacks.onStatsUpdate(MOCK_STATS);
    }
  }

  public subscribe(callbacks: WebSocketCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    
    // Immediately simulate connection and data
    setTimeout(() => {
      if (callbacks.onConnectionChange) {
        callbacks.onConnectionChange(true);
      }
      
      if (callbacks.onInitialData) {
        callbacks.onInitialData({
          players: this.mockPlayers,
          stats: MOCK_STATS
        });
      }
      
      if (callbacks.onStatsUpdate) {
        callbacks.onStatsUpdate(MOCK_STATS);
      }
    }, 500);
    
    return () => this.unsubscribe();
  }

  public unsubscribe() {
    this.callbacks = {};
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  public forceReconnect() {
    // Simulate reconnection with mock data
    setTimeout(() => {
      this.simulateConnection();
    }, 1000);
  }

  public sendCommand(command: string, value?: any) {
    console.log(`Mock command received: ${command}`, value);
  }

  public generatePlayers(count: number) {
    console.log(`Mock generating ${count} players`);
    // Could simulate updating stats if needed
    if (this.callbacks.onStatsUpdate) {
      const updatedStats = {...MOCK_STATS};
      updatedStats.totalPlayers += count;
      this.callbacks.onStatsUpdate(updatedStats);
    }
  }

  public setGenerationRate(milliseconds: number) {
    console.log(`Mock setting generation rate to ${milliseconds}ms`);
    this.generationRate = milliseconds;
    
    if (this.callbacks.onRateChanged) {
      this.callbacks.onRateChanged(milliseconds);
    }
  }
}

// Export singleton instance
export const websocket = typeof window !== 'undefined' 
  ? WebSocketClient.getInstance()
  : ({} as WebSocketClient); // Provide a safe empty object on server-side 