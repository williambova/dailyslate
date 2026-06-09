export type PickType = "favorite" | "underdog";

export interface Pick {
  id: string;
  userId: string;
  gameId: string;
  selectedTeam: string;
  isLocked: boolean;
  isCorrect: boolean | null; // null until the game is final
  pickType: PickType;
  createdAt: string; // ISO
}
