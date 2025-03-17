export type Player = {
  id: string;
  name: string;
  age: number;
  rank: number;
  country: string;
  grandSlams: number;
  hand: "Right" | "Left";
  height: number;
};

export const initialPlayers: Player[] = [
  {
    id: "1",
    name: "Novak Djokovic",
    age: 36,
    rank: 1,
    country: "Serbia",
    grandSlams: 24,
    hand: "Right",
    height: 188,
  },
  {
    id: "2",
    name: "Carlos Alcaraz",
    age: 20,
    rank: 2,
    country: "Spain",
    grandSlams: 4,
    hand: "Right",
    height: 183,
  },
  {
    id: "3",
    name: "Daniil Medvedev",
    age: 28,
    rank: 3,
    country: "Russia",
    grandSlams: 1,
    hand: "Right",
    height: 198,
  },
  {
    id: "4",
    name: "Rafael Nadal",
    age: 37,
    rank: 511,
    country: "Spain",
    grandSlams: 22,
    hand: "Left",
    height: 185,
  },
]; 