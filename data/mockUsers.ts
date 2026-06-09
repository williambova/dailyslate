import type { User } from "@/types";

/**
 * MOCK DATA — users.
 * No auth in the MVP: CURRENT_USER stands in for a logged-in session.
 * Later, replace with Supabase auth (auth.users) + a public `profiles` row,
 * and load the session user from the client.
 */

export const mockUsers: User[] = [
  {
    id: "u_me",
    name: "William",
    username: "william",
    avatar: "WB",
    overallWinPercentage: 64,
    currentStreak: 4,
    bestDailyRecord: "11/12",
    perfectDays: 3,
    favoriteSport: "NBA",
  },
  {
    id: "u_jordan",
    name: "Jordan Hale",
    username: "jhale",
    avatar: "JH",
    overallWinPercentage: 71,
    currentStreak: 7,
    bestDailyRecord: "12/12",
    perfectDays: 5,
    favoriteSport: "NHL",
  },
  {
    id: "u_mara",
    name: "Mara Quinn",
    username: "maraq",
    avatar: "MQ",
    overallWinPercentage: 68,
    currentStreak: 2,
    bestDailyRecord: "10/11",
    perfectDays: 2,
    favoriteSport: "WNBA",
  },
  {
    id: "u_dev",
    name: "Devon Park",
    username: "dpark",
    avatar: "DP",
    overallWinPercentage: 59,
    currentStreak: 0,
    bestDailyRecord: "9/12",
    perfectDays: 1,
    favoriteSport: "MLB",
  },
  {
    id: "u_sam",
    name: "Sam Ortiz",
    username: "sortiz",
    avatar: "SO",
    overallWinPercentage: 62,
    currentStreak: 1,
    bestDailyRecord: "10/12",
    perfectDays: 2,
    favoriteSport: "Soccer",
  },
  {
    id: "u_kai",
    name: "Kai Reed",
    username: "kreed",
    avatar: "KR",
    overallWinPercentage: 55,
    currentStreak: 0,
    bestDailyRecord: "8/10",
    perfectDays: 0,
    favoriteSport: "UFC",
  },
];

export const CURRENT_USER: User = mockUsers[0];

export function getUser(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}
