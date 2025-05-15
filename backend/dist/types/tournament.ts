import { Player } from './player';

export type TournamentCategory = 'Grand Slam' | 'Masters 1000' | 'ATP 500' | 'ATP 250' | 'Challenger' | 'ITF';
export type Surface = 'Hard' | 'Clay' | 'Grass' | 'Carpet' | 'Indoor';

export type Tournament = {
  id: string;
  name: string;
  location: string;
  startDate: Date;
  endDate: Date;
  category: TournamentCategory;
  surface: Surface;
  prize: number;
  players: string[] | Player[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type TournamentFilter = {
  name?: string;
  location?: string;
  category?: TournamentCategory;
  surface?: Surface;
  startDate?: Date;
  endDate?: Date;
  minPrize?: number;
  maxPrize?: number;
}; 