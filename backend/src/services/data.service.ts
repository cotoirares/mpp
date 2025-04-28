import { v4 as uuidv4 } from 'uuid';
import { Player } from '../types/player';
import { Player as PlayerModel } from '../models/player.model';

export class DataService {
  private static instance: DataService;
  private readonly playerNames = [
    "Roger Federer", "Rafael Nadal", "Novak Djokovic", "Andy Murray", "Stan Wawrinka",
    "Alexander Zverev", "Dominic Thiem", "Stefanos Tsitsipas", "Daniil Medvedev",
    "Carlos Alcaraz", "Jannik Sinner", "Andrey Rublev", "Casper Ruud", "Felix Auger-Aliassime",
    "Denis Shapovalov", "Nick Kyrgios", "Gael Monfils", "Kei Nishikori", "Grigor Dimitrov",
    "John Isner", "Milos Raonic", "Marin Cilic", "Juan Martin del Potro", "David Ferrer",
    "Jo-Wilfried Tsonga", "Tomas Berdych", "Richard Gasquet", "Fernando Verdasco"
  ];
  private readonly countries = [
    "Switzerland", "Spain", "Serbia", "UK", "Austria", "Germany", "Greece", "Russia",
    "Canada", "Australia", "France", "Japan", "Bulgaria", "USA", "Croatia", "Argentina",
    "Netherlands", "Italy", "Norway", "Belgium", "Poland", "Denmark", "Sweden", "Czech Republic"
  ];

  private constructor() {
    // Initialize with a large number of players
    this.generateInitialPlayers(100);
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  private async generateInitialPlayers(count: number) {
    const existingPlayers = await PlayerModel.countDocuments();
    if (existingPlayers === 0) {
      for (let i = 0; i < count; i++) {
        await this.generateNewPlayer();
      }
    }
  }

  private generateRealisticPlayer(): Omit<Player, 'id'> {
    const name = this.playerNames[Math.floor(Math.random() * this.playerNames.length)];
    const countryIndex = Math.floor(Math.random() * this.countries.length);
    
    return {
      name,
      age: Math.floor(Math.random() * 15) + 18, // 18-32 years old
      rank: Math.floor(Math.random() * 500) + 1, // 1-500 rank
      country: this.countries[countryIndex],
      grandSlams: Math.floor(Math.random() * 21), // 0-20 grand slams
      hand: Math.random() > 0.15 ? 'Right' : 'Left', // ~85% right-handed
      height: Math.floor(Math.random() * 25) + 175 // 175-200 cm
    };
  }

  private mapToPlayer(doc: any): Player {
    const { _id, ...rest } = doc;
    return {
      ...rest,
      id: _id.toString()
    };
  }

  // Public method for generating new players
  public async generateNewPlayer(): Promise<Player> {
    const playerData = this.generateRealisticPlayer();
    const player = new PlayerModel(playerData);
    await player.save();
    return this.mapToPlayer(player.toObject());
  }

  // CRUD Operations
  public async createPlayer(playerData: Omit<Player, 'id'>): Promise<Player> {
    const player = new PlayerModel(playerData);
    await player.save();
    return this.mapToPlayer(player.toObject());
  }

  public async getAllPlayers(filter: Partial<Player> = {}): Promise<Player[]> {
    const players = await PlayerModel.find(filter);
    return players.map(player => this.mapToPlayer(player.toObject()));
  }

  public async getPlayerById(id: string): Promise<Player | null> {
    const player = await PlayerModel.findById(id);
    return player ? this.mapToPlayer(player.toObject()) : null;
  }

  public async updatePlayer(id: string, playerData: Partial<Player>): Promise<Player | null> {
    const player = await PlayerModel.findByIdAndUpdate(id, playerData, { new: true });
    return player ? this.mapToPlayer(player.toObject()) : null;
  }

  public async deletePlayer(id: string): Promise<boolean> {
    const result = await PlayerModel.findByIdAndDelete(id);
    return !!result;
  }

  public async getStatistics() {
    const stats = await PlayerModel.aggregate([
      {
        $group: {
          _id: null,
          totalPlayers: { $sum: 1 },
          averageAge: { $avg: '$age' },
          averageRank: { $avg: '$rank' },
          averageHeight: { $avg: '$height' },
          totalGrandSlams: { $sum: '$grandSlams' },
          rightHanded: {
            $sum: { $cond: [{ $eq: ['$hand', 'Right'] }, 1, 0] }
          },
          leftHanded: {
            $sum: { $cond: [{ $eq: ['$hand', 'Left'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get country distribution
    const countryStats = await PlayerModel.aggregate([
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get age distribution
    const ageStats = await PlayerModel.aggregate([
      {
        $bucket: {
          groupBy: "$age",
          boundaries: [18, 21, 24, 27, 30, 33, 36],
          default: "36+",
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Get grand slam distribution
    const grandSlamStats = await PlayerModel.aggregate([
      {
        $bucket: {
          groupBy: "$grandSlams",
          boundaries: [0, 5, 10, 15, 20],
          default: "20+",
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const baseStats = stats[0] || {
      totalPlayers: 0,
      averageAge: 0,
      averageRank: 0,
      averageHeight: 0,
      totalGrandSlams: 0,
      rightHanded: 0,
      leftHanded: 0
    };

    return {
      ...baseStats,
      countryStats: countryStats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {} as Record<string, number>),
      ageStats: ageStats.map(item => ({
        range: item._id === "36+" ? "36+" : `${item._id}-${Number(item._id) + 2}`,
        count: item.count
      })),
      grandSlamStats: grandSlamStats.map(item => ({
        range: item._id === "20+" ? "20+" : `${item._id}-${Number(item._id) + 4}`,
        count: item.count
      })),
      handStats: {
        Right: baseStats.rightHanded,
        Left: baseStats.leftHanded
      }
    };
  }
} 