export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string; // initials or emoji for the mock; swap for image URL later
  overallWinPercentage: number; // 0–100
  currentStreak: number; // consecutive days with a winning card
  bestDailyRecord: string; // e.g. "11/12"
  perfectDays: number;
  favoriteSport: string;
}
