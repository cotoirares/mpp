import { Tournament as TournamentModel } from '../models/tournament.model';
import { type Tournament, type TournamentFilter } from '../types/tournament';
import mongoose from 'mongoose';

export class TournamentService {
  private static instance: TournamentService;

  private constructor() {}

  public static getInstance(): TournamentService {
    if (!TournamentService.instance) {
      TournamentService.instance = new TournamentService();
    }
    return TournamentService.instance;
  }

  private mapToTournament(doc: any): Tournament {
    const { _id, ...rest } = doc;
    return {
      ...rest,
      id: _id.toString()
    };
  }

  public async createTournament(tournamentData: Omit<Tournament, 'id'>): Promise<Tournament> {
    const tournament = new TournamentModel(tournamentData);
    await tournament.save();
    return this.mapToTournament(tournament.toObject());
  }

  public async getAllTournaments(filter: TournamentFilter = {}): Promise<Tournament[]> {
    const query: any = {};
    
    if (filter.name) {
      query.name = { $regex: filter.name, $options: 'i' };
    }
    
    if (filter.location) {
      query.location = { $regex: filter.location, $options: 'i' };
    }
    
    if (filter.category) {
      query.category = filter.category;
    }
    
    if (filter.surface) {
      query.surface = filter.surface;
    }
    
    if (filter.startDate) {
      query.startDate = { $gte: filter.startDate };
    }
    
    if (filter.endDate) {
      query.endDate = { $lte: filter.endDate };
    }
    
    if (filter.minPrize !== undefined) {
      query.prize = { ...query.prize, $gte: filter.minPrize };
    }
    
    if (filter.maxPrize !== undefined) {
      query.prize = { ...query.prize, $lte: filter.maxPrize };
    }
    
    const tournaments = await TournamentModel.find(query).populate('players');
    return tournaments.map(tournament => this.mapToTournament(tournament.toObject()));
  }

  public async getTournamentById(id: string): Promise<Tournament | null> {
    const tournament = await TournamentModel.findById(id).populate('players');
    return tournament ? this.mapToTournament(tournament.toObject()) : null;
  }

  public async updateTournament(id: string, tournamentData: Partial<Tournament>): Promise<Tournament | null> {
    const tournament = await TournamentModel.findByIdAndUpdate(id, tournamentData, { new: true });
    return tournament ? this.mapToTournament(tournament.toObject()) : null;
  }

  public async deleteTournament(id: string): Promise<boolean> {
    const result = await TournamentModel.findByIdAndDelete(id);
    return !!result;
  }

  public async addPlayerToTournament(tournamentId: string, playerId: string): Promise<Tournament | null> {
    const tournament = await TournamentModel.findById(tournamentId);
    if (!tournament) {
      return null;
    }
    
    const playerObjectId = new mongoose.Types.ObjectId(playerId);
    if (!tournament.players.some(id => id.equals(playerObjectId))) {
      tournament.players.push(playerObjectId);
      await tournament.save();
    }
    
    return this.mapToTournament(tournament.toObject());
  }

  public async removePlayerFromTournament(tournamentId: string, playerId: string): Promise<Tournament | null> {
    const tournament = await TournamentModel.findById(tournamentId);
    if (!tournament) {
      return null;
    }
    
    tournament.players = tournament.players.filter(id => !id.equals(new mongoose.Types.ObjectId(playerId)));
    await tournament.save();
    
    return this.mapToTournament(tournament.toObject());
  }
} 