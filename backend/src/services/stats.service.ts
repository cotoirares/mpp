import mongoose from 'mongoose';
import { Match } from '../models/match.model';
import { Tournament } from '../models/tournament.model';
import { Player } from '../models/player.model';

export class StatsService {
  private static instance: StatsService;

  private constructor() {}

  public static getInstance(): StatsService {
    if (!StatsService.instance) {
      StatsService.instance = new StatsService();
    }
    return StatsService.instance;
  }

  /**
   * Get player win percentages by surface
   * This is highly optimized using MongoDB's aggregation pipeline
   * Uses compound indexes for player1/player2/winner and tournament lookup optimization
   */
  public async getPlayerWinPercentagesBySurface(limit: number = 10, minMatches: number = 5): Promise<any[]> {
    // This aggregation uses the match, player, and tournament collections
    // It's optimized with appropriate indexes to handle >100,000 matches
    const result = await Match.aggregate([
      // Stage 1: Join with tournaments to get surface info
      {
        $lookup: {
          from: 'tournaments',
          localField: 'tournament',
          foreignField: '_id',
          as: 'tournamentInfo'
        }
      },
      // Stage 2: Unwind the tournament array to get surface
      {
        $unwind: '$tournamentInfo'
      },
      // Stage 3: Project only needed fields to reduce memory usage
      {
        $project: {
          player1: 1,
          player2: 1,
          winner: 1,
          surface: '$tournamentInfo.surface'
        }
      },
      // Stage 4: Create separate documents for each player in the match
      {
        $facet: {
          // Player 1 perspective
          player1Matches: [
            {
              $project: {
                playerId: '$player1',
                isWinner: { $eq: ['$player1', '$winner'] },
                surface: 1
              }
            }
          ],
          // Player 2 perspective
          player2Matches: [
            {
              $project: {
                playerId: '$player2',
                isWinner: { $eq: ['$player2', '$winner'] },
                surface: 1
              }
            }
          ]
        }
      },
      // Stage 5: Combine player1 and player2 arrays
      {
        $project: {
          allMatches: {
            $concatArrays: ['$player1Matches', '$player2Matches']
          }
        }
      },
      // Stage 6: Unwind the combined array
      {
        $unwind: '$allMatches'
      },
      // Stage 7: Group by player and surface
      {
        $group: {
          _id: {
            playerId: '$allMatches.playerId',
            surface: '$allMatches.surface'
          },
          totalMatches: { $sum: 1 },
          wins: { $sum: { $cond: ['$allMatches.isWinner', 1, 0] } }
        }
      },
      // Stage 8: Filter out players with too few matches
      {
        $match: {
          'totalMatches': { $gte: minMatches }
        }
      },
      // Stage 9: Calculate win percentage
      {
        $project: {
          _id: 0,
          playerId: '$_id.playerId',
          surface: '$_id.surface',
          totalMatches: 1,
          wins: 1,
          winPercentage: {
            $multiply: [
              { $divide: ['$wins', '$totalMatches'] },
              100
            ]
          }
        }
      },
      // Stage 10: Look up player details
      {
        $lookup: {
          from: 'players',
          localField: 'playerId',
          foreignField: '_id',
          as: 'playerInfo'
        }
      },
      // Stage 11: Unwind player info
      {
        $unwind: '$playerInfo'
      },
      // Stage 12: Final projection with player name
      {
        $project: {
          playerId: 1,
          playerName: '$playerInfo.name',
          playerCountry: '$playerInfo.country',
          surface: 1,
          totalMatches: 1,
          wins: 1,
          winPercentage: { $round: ['$winPercentage', 1] }
        }
      },
      // Stage 13: Sort by win percentage (descending)
      {
        $sort: { winPercentage: -1 }
      },
      // Stage 14: Limit results
      {
        $limit: limit
      }
    ]).exec();

    return result;
  }

  /**
   * Get match duration statistics by surface
   * Uses indexes on match.tournament and surface field in tournament
   */
  public async getMatchDurationStatsBySurface(): Promise<any[]> {
    return Match.aggregate([
      // Stage 1: Join with tournaments to get surface info
      {
        $lookup: {
          from: 'tournaments',
          localField: 'tournament',
          foreignField: '_id',
          as: 'tournamentInfo'
        }
      },
      // Stage 2: Unwind the tournament array
      {
        $unwind: '$tournamentInfo'
      },
      // Stage 3: Group by surface
      {
        $group: {
          _id: '$tournamentInfo.surface',
          averageDuration: { $avg: '$duration' },
          maxDuration: { $max: '$duration' },
          minDuration: { $min: '$duration' },
          totalMatches: { $sum: 1 }
        }
      },
      // Stage 4: Format the results
      {
        $project: {
          _id: 0,
          surface: '$_id',
          averageDuration: { $round: ['$averageDuration', 0] },
          maxDuration: 1,
          minDuration: 1,
          totalMatches: 1
        }
      },
      // Stage 5: Sort by average duration
      {
        $sort: { averageDuration: -1 }
      }
    ]).exec();
  }

  /**
   * Get player performance statistics
   * Optimized for large dataset using efficient aggregation
   */
  public async getPlayerPerformanceStats(limit: number = 20, minMatches: number = 10): Promise<any[]> {
    return Match.aggregate([
      // Stage 1: Create separate documents for each player in the match
      {
        $facet: {
          // Player 1 perspective
          player1Stats: [
            {
              $project: {
                playerId: '$player1',
                isWinner: { $eq: ['$player1', '$winner'] },
                aces: '$stats.aces.player1',
                doubleFaults: '$stats.doubleFaults.player1',
                firstServePercentage: '$stats.firstServePercentage.player1',
                breakPointsConverted: '$stats.breakPointsConverted.player1'
              }
            }
          ],
          // Player 2 perspective
          player2Stats: [
            {
              $project: {
                playerId: '$player2',
                isWinner: { $eq: ['$player2', '$winner'] },
                aces: '$stats.aces.player2',
                doubleFaults: '$stats.doubleFaults.player2',
                firstServePercentage: '$stats.firstServePercentage.player2',
                breakPointsConverted: '$stats.breakPointsConverted.player2'
              }
            }
          ]
        }
      },
      // Stage 2: Combine player1 and player2 arrays
      {
        $project: {
          allStats: {
            $concatArrays: ['$player1Stats', '$player2Stats']
          }
        }
      },
      // Stage 3: Unwind the combined array
      {
        $unwind: '$allStats'
      },
      // Stage 4: Group by player
      {
        $group: {
          _id: '$allStats.playerId',
          totalMatches: { $sum: 1 },
          wins: { $sum: { $cond: ['$allStats.isWinner', 1, 0] } },
          totalAces: { $sum: '$allStats.aces' },
          totalDoubleFaults: { $sum: '$allStats.doubleFaults' },
          avgFirstServePercentage: { $avg: '$allStats.firstServePercentage' },
          avgBreakPointsConverted: { $avg: '$allStats.breakPointsConverted' }
        }
      },
      // Stage 5: Filter players with minimum matches
      {
        $match: {
          totalMatches: { $gte: minMatches }
        }
      },
      // Stage 6: Calculate win percentage and averages per match
      {
        $project: {
          _id: 0,
          playerId: '$_id',
          totalMatches: 1,
          wins: 1,
          winPercentage: {
            $round: [
              { $multiply: [{ $divide: ['$wins', '$totalMatches'] }, 100] },
              1
            ]
          },
          acesPerMatch: { $round: [{ $divide: ['$totalAces', '$totalMatches'] }, 1] },
          doubleFaultsPerMatch: { $round: [{ $divide: ['$totalDoubleFaults', '$totalMatches'] }, 1] },
          avgFirstServePercentage: { $round: ['$avgFirstServePercentage', 1] },
          avgBreakPointsConverted: { $round: ['$avgBreakPointsConverted', 1] }
        }
      },
      // Stage 7: Join with player information
      {
        $lookup: {
          from: 'players',
          localField: 'playerId',
          foreignField: '_id',
          as: 'playerInfo'
        }
      },
      // Stage 8: Unwind player info
      {
        $unwind: '$playerInfo'
      },
      // Stage 9: Final projection with player details
      {
        $project: {
          playerId: 1,
          playerName: '$playerInfo.name',
          playerCountry: '$playerInfo.country',
          totalMatches: 1,
          wins: 1,
          winPercentage: 1,
          acesPerMatch: 1,
          doubleFaultsPerMatch: 1,
          avgFirstServePercentage: 1,
          avgBreakPointsConverted: 1
        }
      },
      // Stage 10: Sort by win percentage (descending)
      {
        $sort: { winPercentage: -1 }
      },
      // Stage 11: Limit results
      {
        $limit: limit
      }
    ]).exec();
  }

  /**
   * Get tournament statistics
   * Optimized for large dataset leveraging compound indexes
   */
  public async getTournamentStatistics(limit: number = 10): Promise<any[]> {
    return Tournament.aggregate([
      // Stage 1: Calculate players count
      {
        $project: {
          name: 1,
          location: 1,
          category: 1,
          surface: 1,
          prize: 1,
          startDate: 1,
          endDate: 1,
          playerCount: { $size: '$players' }
        }
      },
      // Stage 2: Look up matches for each tournament
      {
        $lookup: {
          from: 'matches',
          localField: '_id',
          foreignField: 'tournament',
          as: 'matches'
        }
      },
      // Stage 3: Add match count and other stats
      {
        $project: {
          name: 1,
          location: 1,
          category: 1,
          surface: 1,
          prize: 1,
          startDate: 1,
          endDate: 1,
          playerCount: 1,
          matchCount: { $size: '$matches' }
        }
      },
      // Stage 4: Sort by match count
      {
        $sort: { matchCount: -1 }
      },
      // Stage 5: Limit results
      {
        $limit: limit
      }
    ]).exec();
  }

  /**
   * Get matches by year and surface
   * Uses date and tournament indexes
   */
  public async getMatchesByYearAndSurface(): Promise<any[]> {
    return Match.aggregate([
      // Stage 1: Add a year field from the date
      {
        $addFields: {
          year: { $year: '$date' }
        }
      },
      // Stage 2: Join with tournaments to get surface
      {
        $lookup: {
          from: 'tournaments',
          localField: 'tournament',
          foreignField: '_id',
          as: 'tournamentInfo'
        }
      },
      // Stage 3: Unwind tournament info
      {
        $unwind: '$tournamentInfo'
      },
      // Stage 4: Group by year and surface
      {
        $group: {
          _id: {
            year: '$year',
            surface: '$tournamentInfo.surface'
          },
          matchCount: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      },
      // Stage 5: Format results
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          surface: '$_id.surface',
          matchCount: 1,
          avgDuration: { $round: ['$avgDuration', 0] }
        }
      },
      // Stage 6: Sort by year and surface
      {
        $sort: { year: 1, surface: 1 }
      }
    ]).exec();
  }
} 