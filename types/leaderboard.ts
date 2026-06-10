export interface LeaderboardEntry {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  picksCorrect: number;
  totalPicks: number;
  winPercentage: number; // 0–100
  rank: number;
  streak: number;
  perfectDay?: boolean;
}

export type LeaderboardScope = "today" | "week" | "all";
