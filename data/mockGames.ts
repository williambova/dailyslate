import type { Game } from "@/types";

/**
 * MOCK DATA — today's slate.
 *
 * ── Where real data plugs in later ─────────────────────────────────────────
 * Swap getTodaySlate() for a fetch against one of:
 *   • SportsDataIO            (schedules + scores, paid)
 *   • The Odds API            (favorite/underdog framing — display only)
 *   • API-Sports / API-Football (broad league coverage)
 *   • ESPN unofficial endpoints (free-ish: site.api.espn.com/.../scoreboard)
 * Normalize each provider's payload into the Game shape below, then persist
 * the daily slate in Supabase (table: games) keyed by date. Status transitions
 * (open → locked → live → final) come from a cron / Edge Function that polls
 * scores. No odds or lines are ever surfaced to the user — favorite/underdog
 * is purely a label for the "pick strategy" stat.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Statuses below are explicit (not derived from time) so the prototype is
 * deterministic. Most games are `open` so you can actually pick + lock a full
 * card; a couple are `live`/`final` to show every card state.
 */

const D = "2026-06-08";
const t = (hhmm: string) => `${D}T${hhmm}:00`;

export const mockGames: Game[] = [
  {
    id: "g1",
    sport: "Basketball",
    league: "NBA",
    awayTeam: "Pacers",
    homeTeam: "Celtics",
    startTime: t("20:00"),
    status: "open",
    winner: null,
    favoriteTeam: "Celtics",
    underdogTeam: "Pacers",
    displayImportance: 1,
    homeScore: null,
    awayScore: null,
  },
  {
    id: "g2",
    sport: "Basketball",
    league: "NBA",
    awayTeam: "Thunder",
    homeTeam: "Nuggets",
    startTime: t("22:30"),
    status: "open",
    winner: null,
    favoriteTeam: "Nuggets",
    underdogTeam: "Thunder",
    displayImportance: 2,
    homeScore: null,
    awayScore: null,
  },
  {
    id: "g3",
    sport: "Basketball",
    league: "WNBA",
    awayTeam: "Liberty",
    homeTeam: "Aces",
    startTime: t("21:00"),
    status: "open",
    winner: null,
    favoriteTeam: "Aces",
    underdogTeam: "Liberty",
    displayImportance: 1,
    homeScore: null,
    awayScore: null,
  },
  {
    id: "g4",
    sport: "Baseball",
    league: "MLB",
    awayTeam: "Yankees",
    homeTeam: "Red Sox",
    startTime: t("19:10"),
    status: "open",
    winner: null,
    favoriteTeam: "Yankees",
    underdogTeam: "Red Sox",
    displayImportance: 2,
    homeScore: null,
    awayScore: null,
  },
  {
    id: "g5",
    sport: "Baseball",
    league: "MLB",
    awayTeam: "Dodgers",
    homeTeam: "Padres",
    startTime: t("16:05"),
    status: "live",
    winner: null,
    favoriteTeam: "Dodgers",
    underdogTeam: "Padres",
    displayImportance: 3,
    homeScore: 2,
    awayScore: 4,
  },
  {
    id: "g6",
    sport: "Hockey",
    league: "NHL",
    awayTeam: "Rangers",
    homeTeam: "Panthers",
    startTime: t("20:00"),
    status: "open",
    winner: null,
    favoriteTeam: "Panthers",
    underdogTeam: "Rangers",
    displayImportance: 1,
    homeScore: null,
    awayScore: null,
  },
  {
    id: "g7",
    sport: "Hockey",
    league: "NHL",
    awayTeam: "Oilers",
    homeTeam: "Stars",
    startTime: t("14:00"),
    status: "final",
    winner: "Stars",
    favoriteTeam: "Stars",
    underdogTeam: "Oilers",
    displayImportance: 2,
    homeScore: 3,
    awayScore: 1,
  },
  {
    id: "g8",
    sport: "Soccer",
    league: "EPL",
    awayTeam: "Arsenal",
    homeTeam: "Chelsea",
    startTime: t("12:30"),
    status: "open",
    winner: null,
    favoriteTeam: "Arsenal",
    underdogTeam: "Chelsea",
    displayImportance: 2,
    homeScore: null,
    awayScore: null,
  },
  {
    id: "g9",
    sport: "Soccer",
    league: "UCL",
    awayTeam: "Real Madrid",
    homeTeam: "Bayern Munich",
    startTime: t("15:00"),
    status: "open",
    winner: null,
    favoriteTeam: "Real Madrid",
    underdogTeam: "Bayern Munich",
    displayImportance: 1,
    homeScore: null,
    awayScore: null,
  },
  {
    id: "g10",
    sport: "Soccer",
    league: "MLS",
    awayTeam: "LAFC",
    homeTeam: "Austin FC",
    startTime: t("20:30"),
    status: "open",
    winner: null,
    favoriteTeam: "LAFC",
    underdogTeam: "Austin FC",
    displayImportance: 3,
    homeScore: null,
    awayScore: null,
  },
  {
    id: "g11",
    sport: "Baseball",
    league: "CBB",
    awayTeam: "Tennessee",
    homeTeam: "LSU",
    startTime: t("19:00"),
    status: "open",
    winner: null,
    favoriteTeam: "Tennessee",
    underdogTeam: "LSU",
    displayImportance: 2,
    homeScore: null,
    awayScore: null,
  },
  {
    id: "g12",
    sport: "MMA",
    league: "UFC",
    awayTeam: "Pavlovich",
    homeTeam: "Volkov",
    startTime: t("13:00"),
    status: "final",
    winner: "Volkov",
    favoriteTeam: "Pavlovich",
    underdogTeam: "Volkov",
    displayImportance: 2,
    homeScore: null,
    awayScore: null,
  },
];

/** Real impl: fetch + normalize a provider payload for the given date. */
export function getTodaySlate(): Game[] {
  return mockGames;
}

export const SLATE_DATE = new Date(D + "T12:00:00");
