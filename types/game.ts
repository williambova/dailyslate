// Sport leagues supported by Daily Slate. Add new leagues here (admin-gated later).
export type League =
  | "WC"
  | "NFL"
  | "NBA"
  | "MLB"
  | "NHL"
  | "WNBA"
  | "NCAAF"
  | "NCAAB"
  | "CBB" // College Baseball
  | "EPL"
  | "UCL" // Champions League
  | "MLS"
  | "UFC"
  | "GOLF";

export type GameStatus = "open" | "locked" | "live" | "final";

export interface Game {
  id: string;
  sport: string; // human label, e.g. "Basketball"
  league: League;
  awayTeam: string;
  homeTeam: string;
  startTime: string; // ISO string
  status: GameStatus;
  winner: string | null; // team name once final
  favoriteTeam: string; // the implied favorite (display only — no odds shown)
  underdogTeam: string;
  displayImportance: number; // 1 = headline, higher = lower priority
  homeScore: number | null;
  awayScore: number | null;
}
