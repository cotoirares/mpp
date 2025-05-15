import { Match as MatchModel } from '../models/match.model';
import { type Match, type MatchFilter } from '../types/match';
import mongoose from 'mongoose';

export class MatchService {
  private static instance: MatchService;

  private constructor() {}

  public static getInstance(): MatchService {
    if (!MatchService.instance) {
      MatchService.instance = new MatchService();
    }
    return MatchService.instance;
  }

  private mapToMatch(doc: any): Match {
    const { _id, ...rest } = doc;
    return {
      ...rest,
      id: _id.toString()
    };
  }

  public async createMatch(matchData: Omit<Match, 'id'>): Promise<Match> {
    const match = new MatchModel(matchData);
    await match.save();
    return this.mapToMatch(match.toObject());
  }

  public async getAllMatches(filter: MatchFilter = {}): Promise<Match[]> {
    const query: any = {};
    
    if (filter.tournament) {
      query.tournament = new mongoose.Types.ObjectId(filter.tournament);
    }
    
    if (filter.player) {
      const playerId = new mongoose.Types.ObjectId(filter.player);
      query.$or = [
        { player1: playerId },
        { player2: playerId }
      ];
    }
    
    if (filter.round) {
      query.round = filter.round;
    }
    
    if (filter.winner) {
      query.winner = new mongoose.Types.ObjectId(filter.winner);
    }
    
    if (filter.startDate) {
      query.date = { ...query.date, $gte: filter.startDate };
    }
    
    if (filter.endDate) {
      query.date = { ...query.date, $lte: filter.endDate };
    }
    
    if (filter.minDuration !== undefined) {
      query.duration = { ...query.duration, $gte: filter.minDuration };
    }
    
    if (filter.maxDuration !== undefined) {
      query.duration = { ...query.duration, $lte: filter.maxDuration };
    }
    
    const matches = await MatchModel.find(query)
      .populate('tournament')
      .populate('player1')
      .populate('player2')
      .populate('winner');
      
    return matches.map(match => this.mapToMatch(match.toObject()));
  }

  public async getMatchById(id: string): Promise<Match | null> {
    const match = await MatchModel.findById(id)
      .populate('tournament')
      .populate('player1')
      .populate('player2')
      .populate('winner');
      
    return match ? this.mapToMatch(match.toObject()) : null;
  }

  public async updateMatch(id: string, matchData: Partial<Match>): Promise<Match | null> {
    const match = await MatchModel.findByIdAndUpdate(id, matchData, { new: true });
    return match ? this.mapToMatch(match.toObject()) : null;
  }

  public async deleteMatch(id: string): Promise<boolean> {
    const result = await MatchModel.findByIdAndDelete(id);
    return !!result;
  }

  public async getMatchesByTournament(tournamentId: string): Promise<Match[]> {
    const matches = await MatchModel.find({ tournament: new mongoose.Types.ObjectId(tournamentId) })
      .populate('player1')
      .populate('player2')
      .populate('winner');
      
    return matches.map(match => this.mapToMatch(match.toObject()));
  }

  public async getMatchesByPlayer(playerId: string): Promise<Match[]> {
    const playerObjectId = new mongoose.Types.ObjectId(playerId);
    const matches = await MatchModel.find({
      $or: [
        { player1: playerObjectId },
        { player2: playerObjectId }
      ]
    })
      .populate('tournament')
      .populate('player1')
      .populate('player2')
      .populate('winner');
      
    return matches.map(match => this.mapToMatch(match.toObject()));
  }

  public async updateMatchScore(
    id: string, 
    score: string, 
    winnerId: string, 
    duration: number, 
    stats: Match['stats']
  ): Promise<Match | null> {
    const match = await MatchModel.findById(id);
    if (!match) {
      return null;
    }
    
    match.score = score;
    match.winner = new mongoose.Types.ObjectId(winnerId);
    match.duration = duration;
    match.stats = stats;
    await match.save();
    
    return this.mapToMatch(match.toObject());
  }
} 