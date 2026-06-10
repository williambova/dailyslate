import type { Game, Pick, PickType } from "@/types";

/**
 * Scoring is intentionally simple for the MVP:
 *   correct pick = 1 point, wrong = 0, win% = correct / completed.
 * "Completed" only counts picks whose game is final, so an in-progress
 * card never looks artificially low.
 */

export function isPickCorrect(pick: Pick, game: Game): boolean | null {
  if (game.status !== "final" || !game.winner) return null;
  return pick.selectedTeam === game.winner;
}

export interface DailyRecord {
  correct: number;
  completed: number; // finals only
  total: number; // every locked pick
  pending: number; // locked but not yet final
  winPct: number; // 0–100 over completed
}

export function computeDailyRecord(picks: Pick[], games: Game[]): DailyRecord {
  const byId = new Map(games.map((g) => [g.id, g]));
  let correct = 0;
  let completed = 0;
  for (const p of picks) {
    const g = byId.get(p.gameId);
    if (!g) continue;
    const result = isPickCorrect(p, g);
    if (result === null) continue;
    completed += 1;
    if (result) correct += 1;
  }
  const total = picks.length;
  return {
    correct,
    completed,
    total,
    pending: total - completed,
    winPct: completed === 0 ? 0 : Math.round((correct / completed) * 100),
  };
}

export function pickTypeFor(team: string, game: Game): PickType {
  return team === game.favoriteTeam ? "favorite" : "underdog";
}

export function countByType(picks: Pick[]): { favorites: number; underdogs: number } {
  let favorites = 0;
  let underdogs = 0;
  for (const p of picks) p.pickType === "favorite" ? favorites++ : underdogs++;
  return { favorites, underdogs };
}

// ---- Badges ----------------------------------------------------------------

export type BadgeKey =
  | "perfect"
  | "streak"
  | "underdog"
  | "groupWinner"
  | "ranTheSlate";

export interface EarnedBadge {
  key: BadgeKey;
  label: string;
  description: string;
}

/** Derive earned badges from a finished (or finishing) daily card. */
export function deriveBadges(
  record: DailyRecord,
  picks: Pick[],
  games: Game[],
  streak: number
): EarnedBadge[] {
  const earned: EarnedBadge[] = [];
  const perfect = record.completed > 0 && record.correct === record.completed;

  if (perfect && record.completed === record.total && record.total > 0) {
    earned.push({
      key: "ranTheSlate",
      label: "Ran the Slate",
      description: "Went a perfect 100% on the full card.",
    });
  } else if (perfect) {
    earned.push({
      key: "perfect",
      label: "Perfect Day",
      description: "No misses on completed games.",
    });
  }

  const byId = new Map(games.map((g) => [g.id, g]));
  const underdogHit = picks.some((p) => {
    const g = byId.get(p.gameId);
    return g && p.pickType === "underdog" && isPickCorrect(p, g) === true;
  });
  if (underdogHit) {
    earned.push({
      key: "underdog",
      label: "Underdog Hit",
      description: "Called an upset correctly.",
    });
  }

  if (streak >= 3) {
    earned.push({
      key: "streak",
      label: `${streak}-Day Streak`,
      description: "Winning cards on consecutive days.",
    });
  }

  return earned;
}
