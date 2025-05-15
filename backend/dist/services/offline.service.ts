import { DataService } from './data.service';
import { Player } from '../types/player';

export interface OfflineOperation {
  type: 'create' | 'update' | 'delete';
  data: Partial<Player>;
  timestamp: number;
  id?: string;
}

export class OfflineService {
  private static instance: OfflineService;
  private operations: OfflineOperation[] = [];
  private isOnline: boolean = true;
  private isServerAvailable: boolean = true;
  private dataService: DataService;

  private constructor() {
    this.dataService = DataService.getInstance();
    this.setupNetworkDetection();
    this.setupServerDetection();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private setupNetworkDetection() {
    // In a browser environment, this would use the navigator.onLine API
    // For the backend, we'll simulate network detection
    setInterval(() => {
      this.checkNetworkStatus();
    }, 5000);
  }

  private setupServerDetection() {
    setInterval(() => {
      this.checkServerStatus();
    }, 5000);
  }

  private async checkNetworkStatus() {
    try {
      const response = await fetch('https://www.google.com');
      this.isOnline = response.ok;
    } catch {
      this.isOnline = false;
    }
  }

  private async checkServerStatus() {
    try {
      // Try to perform a simple operation
      await this.dataService.getAllPlayers({});
      this.isServerAvailable = true;
    } catch {
      this.isServerAvailable = false;
    }
  }

  public getStatus() {
    return {
      isOnline: this.isOnline,
      isServerAvailable: this.isServerAvailable,
      pendingOperations: this.operations.length
    };
  }

  public async queueOperation(operation: OfflineOperation) {
    this.operations.push(operation);
    await this.syncIfPossible();
    return operation;
  }

  public async syncIfPossible() {
    if (this.isOnline && this.isServerAvailable) {
      const ops = [...this.operations];
      this.operations = [];

      for (const op of ops) {
        try {
          switch (op.type) {
            case 'create':
              await this.dataService.createPlayer(op.data as Omit<Player, 'id'>);
              break;
            case 'update':
              if (op.id) {
                await this.dataService.updatePlayer(op.id, op.data);
              }
              break;
            case 'delete':
              if (op.id) {
                await this.dataService.deletePlayer(op.id);
              }
              break;
          }
        } catch (error) {
          console.error('Error syncing operation:', error);
          this.operations.push(op);
        }
      }
    }
  }
} 