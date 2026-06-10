import { NextResponse } from "next/server";
import type { Game, League } from "@/types";
import { fetchLeague, easternYyyymmdd, ESPN_ENDPOINTS } from "@/lib/espn";
import { sportMeta } from "@/lib/sportConfig";

/**
 * GET /api/slate?date=YYYYMMDD
 *
 * Server-side aggregation of today's real games from ESPN across the leagues
 * we support, normalized into Game[] and ordered by sport. Runs on the server
 * (no CORS, ESPN never exposed to the client). The client store calls this and
 * falls back to mock data if it returns empty/unreachable.
 *
 * Per-league caps keep busy days (college) from flooding the slate; tune
 * MAX_PER_LEAGUE per product taste, or curate to "featured" games later.
 */

export const revalidate = 60;

// Which leagues to include, in slate order. Trim to taste (e.g. US majors only).
const LEAGUES: League[] = (Object.keys(ESPN_ENDPOINTS) as League[]).sort(
  (a, b) => sportMeta(a).order - sportMeta(b).order
);

const MAX_PER_LEAGUE: Partial<Record<League, number>> = {
  NCAAF: 8,
  NCAAB: 8,
  CBB: 6,
};
const DEFAULT_CAP = 12;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const yyyymmdd =
    dateParam && /^\d{8}$/.test(dateParam) ? dateParam : easternYyyymmdd();

  const results = await Promise.all(
    LEAGUES.map((lg) => fetchLeague(lg, yyyymmdd, MAX_PER_LEAGUE[lg] ?? DEFAULT_CAP))
  );

  // Flatten in league order, re-numbering importance within each league.
  const games: Game[] = [];
  results.forEach((leagueGames) => {
    leagueGames.forEach((g, i) => games.push({ ...g, displayImportance: i + 1 }));
  });

  const isoDate = `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T12:00:00`;

  return NextResponse.json(
    { date: isoDate, count: games.length, source: "espn", games },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } }
  );
}

