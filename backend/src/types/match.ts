import { Player } from './player';
import { Tournament } from './tournament';

export type Round = 'Qualification' | 'First Round' | 'Second Round' | 'Third Round' | 'Fourth Round' | 'Quarter-final' | 'Semi-final' | 'Final';

export type MatchStats = {
  aces: {
    player1: number;
    player2: number;
  };
  doubleFaults: {
    player1: number;
    player2: number;
  };
  firstServePercentage: {
    player1: number;
    player2: number;
  };
  breakPointsConverted: {
    player1: number;
    player2: number;
  };
};

export type Match = {
  id: string;
  tournament: string | Tournament;
  player1: string | Player;
  player2: string | Player;
  round: Round;
  score?: string;
  date: Date;
  winner?: string | Player;
  duration?: number;
  stats: MatchStats;
  createdAt?: Date;
  updatedAt?: Date;
};

export type MatchFilter = {
  tournament?: string;
  player?: string;
  round?: Round;
  winner?: string;
  startDate?: Date;
  endDate?: Date;
  minDuration?: number;
  maxDuration?: number;
}; 