import { v4 as uuidv4 } from 'uuid';
import { Player } from '../types/player';
import { Player as PlayerModel } from '../models/player.model';
import { TournamentService } from './tournament.service';
import { MatchService } from './match.service';
import { Tournament } from '../types/tournament';
import { Match } from '../types/match';

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

  private readonly tournamentNames = [
    "Australian Open", "Roland Garros", "Wimbledon", "US Open", 
    "ATP Finals", "Indian Wells Masters", "Miami Open", "Monte-Carlo Masters",
    "Madrid Open", "Italian Open", "Cincinnati Masters", "Shanghai Masters", 
    "Paris Masters", "Canada Masters", "Barcelona Open", "Queen's Club Championships"
  ];

  private readonly tournamentLocations = [
    "Melbourne, Australia", "Paris, France", "London, UK", "New York, USA",
    "Turin, Italy", "Indian Wells, USA", "Miami, USA", "Monte Carlo, Monaco",
    "Madrid, Spain", "Rome, Italy", "Cincinnati, USA", "Shanghai, China",
    "Paris, France", "Toronto/Montreal, Canada", "Barcelona, Spain", "London, UK"
  ];

  private readonly tournamentCategories = [
    "Grand Slam", "Grand Slam", "Grand Slam", "Grand Slam",
    "ATP Finals", "Masters 1000", "Masters 1000", "Masters 1000",
    "Masters 1000", "Masters 1000", "Masters 1000", "Masters 1000",
    "Masters 1000", "Masters 1000", "ATP 500", "ATP 500"
  ];

  private readonly surfaces = [
    "Hard", "Clay", "Grass", "Hard",
    "Hard", "Hard", "Hard", "Clay",
    "Clay", "Clay", "Hard", "Hard",
    "Hard", "Hard", "Clay", "Grass"
  ];

  private constructor() {
    // Initialize with players, tournaments and matches
    this.initializeDatabase();
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  private async initializeDatabase() {
    // Generate initial players
    const playersCount = await PlayerModel.countDocuments();
    if (playersCount === 0) {
      await this.generateInitialPlayers(50);
    }

    // Generate tournaments and matches after players are created
    setTimeout(async () => {
      const players = await this.getAllPlayers();
      if (players.length > 0) {
        await this.generateSampleTournaments(players);
      }
    }, 5000);
  }

  private async generateInitialPlayers(count: number) {
    for (let i = 0; i < count; i++) {
      await this.generateNewPlayer();
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

  // Generate sample tournaments and matches
  public async generateSampleTournaments(players: Player[]) {
    const tournamentService = TournamentService.getInstance();
    const matchService = MatchService.getInstance();
    
    // Check if tournaments already exist
    const tournaments = await tournamentService.getAllTournaments();
    if (tournaments.length > 0) {
      return; // Already have tournaments
    }
    
    console.log("Generating sample tournaments and matches...");
    
    const createdTournaments: Tournament[] = [];
    
    // Create tournaments
    for (let i = 0; i < this.tournamentNames.length; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 180)); // Random date in last 6 months
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14); // Two weeks tournament
      
      const tournamentData = {
        name: this.tournamentNames[i],
        location: this.tournamentLocations[i],
        startDate,
        endDate,
        category: this.tournamentCategories[i] as any,
        surface: this.surfaces[i] as any,
        prize: Math.floor(Math.random() * 10000000) + 1000000, // 1M to 11M prize
        players: []
      };
      
      try {
        const tournament = await tournamentService.createTournament(tournamentData);
        createdTournaments.push(tournament);
        
        // Add some players to this tournament
        const tournamentPlayers = this.getRandomSubset(players, 16); // 16 players per tournament
        for (const player of tournamentPlayers) {
          await tournamentService.addPlayerToTournament(tournament.id, player.id);
        }
        
        // Generate matches for this tournament
        await this.generateMatchesForTournament(tournament.id, tournamentPlayers, matchService);
        
        console.log(`Created tournament: ${tournament.name}`);
      } catch (error) {
        console.error(`Failed to create tournament ${this.tournamentNames[i]}:`, error);
      }
    }
    
    console.log(`Created ${createdTournaments.length} tournaments with players and matches`);
  }
  
  private getRandomSubset<T>(array: T[], size: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size);
  }
  
  private async generateMatchesForTournament(
    tournamentId: string, 
    players: Player[], 
    matchService: MatchService
  ) {
    const rounds = [
      'First Round', 'Second Round', 'Quarter-final', 'Semi-final', 'Final'
    ];
    
    let remainingPlayers = [...players];
    
    for (let round = 0; round < rounds.length; round++) {
      const matchesInRound = remainingPlayers.length / 2;
      const nextRoundPlayers: Player[] = [];
      
      for (let i = 0; i < matchesInRound; i++) {
        const player1 = remainingPlayers[i * 2];
        const player2 = remainingPlayers[i * 2 + 1];
        
        const matchDate = new Date();
        matchDate.setDate(matchDate.getDate() - Math.floor(Math.random() * 90)); // Random date in last 3 months
        
        // Determine winner randomly
        const winner = Math.random() > 0.5 ? player1 : player2;
        nextRoundPlayers.push(winner);
        
        // Generate realistic score
        const sets = Math.random() > 0.2 ? 3 : 5; // 80% chance of 3 sets, 20% chance of 5 sets
        let score = '';
        for (let s = 0; s < sets; s++) {
          const isWinnerSet = Math.random() > 0.3; // 70% chance winner wins the set
          const winnerGames = isWinnerSet ? 6 : Math.floor(Math.random() * 5) + 1;
          const loserGames = isWinnerSet ? Math.floor(Math.random() * 5) : 6;
          
          if (s > 0) score += ' ';
          score += `${winner.id === player1.id ? winnerGames : loserGames}-${winner.id === player1.id ? loserGames : winnerGames}`;
        }
        
        const duration = Math.floor(Math.random() * 180) + 60; // 1-4 hours in minutes
        
        const matchData: Omit<Match, 'id'> = {
          tournament: tournamentId,
          player1: player1.id,
          player2: player2.id,
          round: rounds[round] as any,
          score,
          date: matchDate,
          winner: winner.id,
          duration,
          stats: {
            aces: {
              player1: Math.floor(Math.random() * 20),
              player2: Math.floor(Math.random() * 20)
            },
            doubleFaults: {
              player1: Math.floor(Math.random() * 10),
              player2: Math.floor(Math.random() * 10)
            },
            firstServePercentage: {
              player1: Math.floor(Math.random() * 30) + 50, // 50-80%
              player2: Math.floor(Math.random() * 30) + 50  // 50-80%
            },
            breakPointsConverted: {
              player1: Math.floor(Math.random() * 50) + 30, // 30-80%
              player2: Math.floor(Math.random() * 50) + 30  // 30-80%
            }
          }
        };
        
        try {
          await matchService.createMatch(matchData);
        } catch (error) {
          console.error('Failed to create match:', error);
        }
      }
      
      // Update remaining players for next round
      remainingPlayers = nextRoundPlayers;
    }
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