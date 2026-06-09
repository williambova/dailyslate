import type { LeaderboardEntry, LeaderboardScope } from "@/types";
import { mockUsers } from "./mockUsers";

/**
 * MOCK DATA — leaderboards.
 * Later: compute server-side from the `picks` table joined against final
 * `games`, materialized per scope (today / rolling 7 days / all-time) in a
 * Supabase view or scheduled aggregate. `rank` is derived, not stored.
 */

type Row = Omit<LeaderboardEntry, "rank" | "name" | "username" | "avatar"> & {
  userId: string;
};

function hydrate(rows: Row[]): LeaderboardEntry[] {
  return rows
    .map((r) => {
      const u = mockUsers.find((x) => x.id === r.userId)!;
      return {
        ...r,
        name: u.name,
        username: u.username,
        avatar: u.avatar,
      };
    })
    .sort((a, b) =>
      b.winPercentage - a.winPercentage || b.picksCorrect - a.picksCorrect
    )
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

// "Today" reflects friends who already have completed games on the slate.
const today: Row[] = [
  { userId: "u_jordan", picksCorrect: 3, totalPicks: 3, winPercentage: 100, streak: 7, perfectDay: true },
  { userId: "u_mara", picksCorrect: 2, totalPicks: 3, winPercentage: 67, streak: 2 },
  { userId: "u_me", picksCorrect: 1, totalPicks: 2, winPercentage: 50, streak: 4 },
  { userId: "u_sam", picksCorrect: 1, totalPicks: 3, winPercentage: 33, streak: 1 },
  { userId: "u_dev", picksCorrect: 0, totalPicks: 2, winPercentage: 0, streak: 0 },
];

const week: Row[] = [
  { userId: "u_jordan", picksCorrect: 41, totalPicks: 58, winPercentage: 71, streak: 7 },
  { userId: "u_mara", picksCorrect: 38, totalPicks: 56, winPercentage: 68, streak: 2 },
  { userId: "u_me", picksCorrect: 36, totalPicks: 57, winPercentage: 63, streak: 4 },
  { userId: "u_sam", picksCorrect: 33, totalPicks: 54, winPercentage: 61, streak: 1 },
  { userId: "u_dev", picksCorrect: 31, totalPicks: 55, winPercentage: 56, streak: 0 },
  { userId: "u_kai", picksCorrect: 27, totalPicks: 52, winPercentage: 52, streak: 0 },
];

const all: Row[] = [
  { userId: "u_jordan", picksCorrect: 612, totalPicks: 862, winPercentage: 71, streak: 7 },
  { userId: "u_mara", picksCorrect: 548, totalPicks: 806, winPercentage: 68, streak: 2 },
  { userId: "u_me", picksCorrect: 503, totalPicks: 786, winPercentage: 64, streak: 4 },
  { userId: "u_sam", picksCorrect: 461, totalPicks: 744, winPercentage: 62, streak: 1 },
  { userId: "u_dev", picksCorrect: 437, totalPicks: 741, winPercentage: 59, streak: 0 },
  { userId: "u_kai", picksCorrect: 388, totalPicks: 705, winPercentage: 55, streak: 0 },
];

export const leaderboards: Record<LeaderboardScope, LeaderboardEntry[]> = {
  today: hydrate(today),
  week: hydrate(week),
  all: hydrate(all),
};
