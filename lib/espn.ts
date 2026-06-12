import type { Game, GameStatus, League } from "@/types";

/**
 * ESPN adapter — turns ESPN's free, unofficial scoreboard JSON into our `Game`
 * shape. Called server-side only (see app/api/slate/route.ts) so we never hit
 * CORS and never expose ESPN directly to the browser.
 *
 * Endpoint: https://site.api.espn.com/apis/site/v2/sports/{sport}/{path}/scoreboard?dates=YYYYMMDD
 * Unofficial + unauthenticated. Be respectful: cache responses (the route
 * does, 60s) and tolerate failures per-league.
 */

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

// Our League -> ESPN {sport, path}. GOLF is omitted (leaderboard format,
// not head-to-head). UFC is included: each fight on a card maps to a game
// via mapFight below.
export const ESPN_ENDPOINTS: Partial<Record<League, { sport: string; path: string }>> = {
  WC: { sport: "soccer", path: "fifa.world" },
  UFC: { sport: "mma", path: "ufc" },
  NBA: { sport: "basketball", path: "nba" },
  WNBA: { sport: "basketball", path: "wnba" },
  NFL: { sport: "football", path: "nfl" },
  MLB: { sport: "baseball", path: "mlb" },
  NHL: { sport: "hockey", path: "nhl" },
  NCAAF: { sport: "football", path: "college-football" },
  NCAAB: { sport: "basketball", path: "mens-college-basketball" },
  CBB: { sport: "baseball", path: "college-baseball" },
  EPL: { sport: "soccer", path: "eng.1" },
  UCL: { sport: "soccer", path: "uefa.champions" },
  MLS: { sport: "soccer", path: "usa.1" },
};

function mapStatus(state: string | undefined): GameStatus {
  if (state === "in") return "live";
  if (state === "post") return "final";
  return "open"; // "pre" or anything unexpected
}

function teamName(team: any): string {
  return team?.shortDisplayName || team?.name || team?.displayName || "TBD";
}

/** Derive a favorite/underdog label from odds when present; else default to home. */
function favorites(
  home: { name: string; abbr: string },
  away: { name: string; abbr: string },
  odds: any
): { favoriteTeam: string; underdogTeam: string } {
  const fallback = { favoriteTeam: home.name, underdogTeam: away.name };
  if (!odds) return fallback;

  if (odds.homeTeamOdds?.favorite === true)
    return { favoriteTeam: home.name, underdogTeam: away.name };
  if (odds.awayTeamOdds?.favorite === true)
    return { favoriteTeam: away.name, underdogTeam: home.name };

  // details looks like "PHI -3.5" — first token is the favored abbreviation.
  const abbr = typeof odds.details === "string" ? odds.details.split(" ")[0] : "";
  if (abbr && abbr === away.abbr)
    return { favoriteTeam: away.name, underdogTeam: home.name };
  return fallback;
}

/** Map a single ESPN event to a Game. Returns null for non-2-team events. */
export function mapEvent(event: any, league: League, importance: number): Game | null {
  const comp = event?.competitions?.[0];
  const competitors: any[] = comp?.competitors ?? [];
  if (competitors.length !== 2) return null;

  const homeC = competitors.find((c) => c.homeAway === "home") ?? competitors[0];
  const awayC = competitors.find((c) => c.homeAway === "away") ?? competitors[1];
  if (!homeC?.team || !awayC?.team) return null;

  const home = { name: teamName(homeC.team), abbr: homeC.team.abbreviation ?? "" };
  const away = { name: teamName(awayC.team), abbr: awayC.team.abbreviation ?? "" };

  const status = mapStatus(comp?.status?.type?.state ?? event?.status?.type?.state);
  const homeScore = homeC.score != null && homeC.score !== "" ? Number(homeC.score) : null;
  const awayScore = awayC.score != null && awayC.score !== "" ? Number(awayC.score) : null;

  let winner: string | null = null;
  if (status === "final") {
    if (homeC.winner === true) winner = home.name;
    else if (awayC.winner === true) winner = away.name;
  }

  const { favoriteTeam, underdogTeam } = favorites(home, away, comp?.odds?.[0]);

  return {
    id: `espn-${event.id}`,
    sport: ESPN_ENDPOINTS[league]?.sport ?? league,
    league,
    awayTeam: away.name,
    homeTeam: home.name,
    startTime: event.date,
    status,
    winner,
    favoriteTeam,
    underdogTeam,
    displayImportance: importance,
    homeScore,
    awayScore,
  };
}

function athleteName(c: any): string {
  return (
    c?.athlete?.shortName ||
    c?.athlete?.displayName ||
    c?.team?.shortDisplayName ||
    "TBD"
  );
}

/**
 * Map a single UFC fight (one competition on a card) to a Game. MMA payloads
 * nest many fights per event and use `athlete` instead of `team`.
 */
function mapFight(event: any, comp: any, importance: number): Game | null {
  const competitors: any[] = comp?.competitors ?? [];
  if (competitors.length !== 2) return null;

  const a = competitors[0];
  const b = competitors[1];
  const nameA = athleteName(a);
  const nameB = athleteName(b);
  if (nameA === "TBD" && nameB === "TBD") return null;

  const status = mapStatus(comp?.status?.type?.state ?? event?.status?.type?.state);

  let winner: string | null = null;
  if (status === "final") {
    if (a?.winner === true) winner = nameA;
    else if (b?.winner === true) winner = nameB;
  }

  return {
    id: `espn-${comp?.id ?? event.id}`,
    sport: "mma",
    league: "UFC",
    awayTeam: nameA,
    homeTeam: nameB,
    startTime: comp?.date || event?.date,
    status,
    winner,
    favoriteTeam: nameA, // display-only; MMA odds payloads are inconsistent
    underdogTeam: nameB,
    displayImportance: importance,
    homeScore: null,
    awayScore: null,
  };
}

/**
 * Fetch one league's scoreboard for a given YYYYMMDD and normalize it.
 * `maxGames` caps noisy slates (e.g. college). Failures resolve to [].
 */
export async function fetchLeague(
  league: League,
  yyyymmdd: string,
  maxGames = 12
): Promise<Game[]> {
  const ep = ESPN_ENDPOINTS[league];
  if (!ep) return [];

  const url = `${ESPN_BASE}/${ep.sport}/${ep.path}/scoreboard?dates=${yyyymmdd}`;
  try {
    const res = await fetch(url, {
      // Cache upstream for 60s — friendly to the unofficial API + fast loads.
      next: { revalidate: 60 },
      headers: { "User-Agent": "DailySlate/1.0" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const events: any[] = data?.events ?? [];
    const games: Game[] = [];

    if (league === "UFC") {
      // Each event is a fight card; each competition is a fight. Keep ESPN's
      // order (main event first) instead of sorting by time, so capping
      // trims prelims rather than the main card.
      events.forEach((ev) => {
        (ev?.competitions ?? []).forEach((comp: any) => {
          const g = mapFight(ev, comp, games.length + 1);
          if (g) games.push(g);
        });
      });
      return games.slice(0, maxGames);
    }

    events.forEach((ev, i) => {
      const g = mapEvent(ev, league, i + 1);
      if (g) games.push(g);
    });
    // Sort by start time, then cap.
    games.sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
    return games.slice(0, maxGames);
  } catch {
    return [];
  }
}

/** YYYYMMDD for the given date in US Eastern (aligns with US sports days). */
export function easternYyyymmdd(d = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // en-CA -> "YYYY-MM-DD"
  return parts.replace(/-/g, "");
}

/** YYYYMMDD for N days ago, US Eastern. */
export function easternYyyymmddDaysAgo(daysAgo: number): string {
  return easternYyyymmdd(new Date(Date.now() - daysAgo * 86400000));
}

/**
 * The slate_date string used as the key in the picks/results tables.
 * Must match what /api/slate returns as `date` (ISO noon, no timezone).
 */
export function slateKeyFromYyyymmdd(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T12:00:00`;
}
