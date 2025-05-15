export type Player = {
  id: string;
  name: string;
  age: number;
  rank: number;
  country: string;
  grandSlams: number;
  hand: "Right" | "Left";
  height: number;
  videoUrl?: string;
  videoSize?: number;
  videoType?: string;
}; 