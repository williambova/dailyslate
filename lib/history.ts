import { supabase } from "@/lib/supabase";
import type { Game } from "@/types";

/**
 * History + standings. Picks are graded against the `results` table (written
 * server-side by /api/grade). For TODAY, finals come from the live slate in
 * memory instead, so standings move while games are still finishing.
 */

export interface PickRow {
  user_id: string;
  slate_date: string;
  game_id: string;
  selected_team: string;
  league?: string | null;
}

export interface ResultRow {
  slate_date: string;
  game_id: string;
  winner: string;
}

export interface StandingRow {
  userId: string;
  locked: number;
  correct: number;
  completed: number;
  winPct: number | null;
}

/** The slate_date keys for today back through N-1 days ago (Eastern). */
export function recentSlateKeys(days: number): string[] {
  const keys: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400000);
    const ymd = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d); // YYYY-MM-DD
    keys.push(`${ymd}T12:00:00`);
  }
  return keys;
}

export function yyyymmddFromSlateKey(key: string): string {
  return key.slice(0, 10).replace(/-/g, "");
}

/** Locked picks for members across a set of slate dates. */
export async function fetchPicksRange(
  memberIds: string[],
  slateDates: string[]
): Promise<PickRow[]> {
  if (!supabase || memberIds.length === 0 || slateDates.length === 0) return [];
  const { data, error } = await supabase
    .from("picks")
    .select("user_id, slate_date, game_id, selected_team, league")
    .in("user_id", memberIds)
    .in("slate_date", slateDates)
    .eq("is_locked", true);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Stored results for a set of slate dates. */
export async function fetchResultsRange(
  slateDates: string[]
): Promise<ResultRow[]> {
  if (!supabase || slateDates.length === 0) return [];
  const { data, error } = await supabase
    .from("results")
    .select("slate_date, game_id, winner")
    .in("slate_date", slateDates);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Lazy backfill: for past days that have picks but no stored results, ask the
 * server to grade them (it pulls finals from ESPN and persists). Returns true
 * if anything was graded, so the caller can refetch.
 */
export async function ensureGraded(
  picksRows: PickRow[],
  resultsRows: ResultRow[],
  todayKey: string
): Promise<boolean> {
  const haveResults = new Set(resultsRows.map((r) => r.slate_date));
  const need = Array.from(
    new Set(
      picksRows
        .map((p) => p.slate_date)
        .filter((d) => d !== todayKey && !haveResults.has(d))
    )
  ).slice(0, 7); // cap a single page-load's backfill

  if (need.length === 0) return false;

  await Promise.all(
    need.map((d) =>
      fetch(`/api/grade?date=${yyyymmddFromSlateKey(d)}`).catch(() => null)
    )
  );
  return true;
}

/**
 * Grade picks → per-user standings. Past days grade against stored results;
 * today's grade against the live slate's finals (todayGames).
 */
export function computeStandings(
  picksRows: PickRow[],
  resultsRows: ResultRow[],
  todayKey: string,
  todayGames: Game[]
): Map<string, StandingRow> {
  const winners = new Map<string, string>(); // `${slate_date}|${game_id}` → winner
  for (const r of resultsRows) winners.set(`${r.slate_date}|${r.game_id}`, r.winner);
  for (const g of todayGames) {
    if (g.status === "final" && g.winner) {
      winners.set(`${todayKey}|${g.id}`, g.winner);
    }
  }

  const by = new Map<string, StandingRow>();
  for (const p of picksRows) {
    const s =
      by.get(p.user_id) ??
      ({ userId: p.user_id, locked: 0, correct: 0, completed: 0, winPct: null } as StandingRow);
    s.locked += 1;
    const winner = winners.get(`${p.slate_date}|${p.game_id}`);
    if (winner) {
      s.completed += 1;
      if (winner === p.selected_team) s.correct += 1;
    }
    by.set(p.user_id, s);
  }
  for (const s of Array.from(by.values())) {
    s.winPct = s.completed > 0 ? Math.round((s.correct / s.completed) * 100) : null;
  }
  return by;
}

/** Per-day record for one user (profile history). Most recent first. */
export function dailyRecords(
  picksRows: PickRow[],
  resultsRows: ResultRow[],
  todayKey: string,
  todayGames: Game[]
): { slateDate: string; correct: number; completed: number; locked: number }[] {
  const winners = new Map<string, string>();
  for (const r of resultsRows) winners.set(`${r.slate_date}|${r.game_id}`, r.winner);
  for (const g of todayGames) {
    if (g.status === "final" && g.winner) winners.set(`${todayKey}|${g.id}`, g.winner);
  }

  const byDay = new Map<string, { correct: number; completed: number; locked: number }>();
  for (const p of picksRows) {
    const d = byDay.get(p.slate_date) ?? { correct: 0, completed: 0, locked: 0 };
    d.locked += 1;
    const winner = winners.get(`${p.slate_date}|${p.game_id}`);
    if (winner) {
      d.completed += 1;
      if (winner === p.selected_team) d.correct += 1;
    }
    byDay.set(p.slate_date, d);
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([slateDate, d]) => ({ slateDate, ...d }));
}

/**
 * Per-league record for one user — e.g. World Cup 9-3, NBA 12-8. Grades the
 * same way as standings: stored results for past days, live finals for today.
 */
export function leagueRecords(
  picksRows: PickRow[],
  resultsRows: ResultRow[],
  todayKey: string,
  todayGames: Game[]
): { league: string; correct: number; completed: number; locked: number }[] {
  const winners = new Map<string, string>();
  for (const r of resultsRows) winners.set(`${r.slate_date}|${r.game_id}`, r.winner);
  const todayLeague = new Map<string, string>();
  for (const g of todayGames) {
    todayLeague.set(g.id, g.league);
    if (g.status === "final" && g.winner) winners.set(`${todayKey}|${g.id}`, g.winner);
  }

  const by = new Map<string, { correct: number; completed: number; locked: number }>();
  for (const p of picksRows) {
    const league = p.league || todayLeague.get(p.game_id) || "OTHER";
    const rec = by.get(league) ?? { correct: 0, completed: 0, locked: 0 };
    rec.locked += 1;
    const winner = winners.get(`${p.slate_date}|${p.game_id}`);
    if (winner) {
      rec.completed += 1;
      if (winner === p.selected_team) rec.correct += 1;
    }
    by.set(league, rec);
  }

  return Array.from(by.entries())
    .map(([league, rec]) => ({ league, ...rec }))
    .sort((a, b) => b.completed - a.completed || b.locked - a.locked);
}
