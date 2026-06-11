import type { League } from "@/types";

export interface SportMeta {
  label: string; // section header, e.g. "NBA"
  long: string; // "Pro Basketball"
  abbr: string; // chip text
  accent: string; // hex used for borders/glows/share rows
  tw: string; // tailwind text color class
  order: number; // section sort order on the slate
}

/**
 * Single source of truth for how each league is branded across the app
 * (slate sections, game-card chips, and share-card rows).
 */
export const SPORTS: Record<League, SportMeta> = {
  WC: { label: "World Cup", long: "FIFA World Cup", abbr: "WC", accent: "#FFD24A", tw: "text-sport-college", order: 0 },
  NBA: { label: "NBA", long: "Pro Basketball", abbr: "NBA", accent: "#FF7A1A", tw: "text-sport-nba", order: 1 },
  WNBA: { label: "WNBA", long: "WNBA", abbr: "WNBA", accent: "#FF5C8A", tw: "text-sport-wnba", order: 2 },
  NFL: { label: "NFL", long: "Pro Football", abbr: "NFL", accent: "#7C9CFF", tw: "text-sport-nfl", order: 3 },
  MLB: { label: "MLB", long: "Pro Baseball", abbr: "MLB", accent: "#1FB6B6", tw: "text-sport-mlb", order: 4 },
  NHL: { label: "NHL", long: "Pro Hockey", abbr: "NHL", accent: "#A875FF", tw: "text-sport-nhl", order: 5 },
  EPL: { label: "Premier League", long: "English Premier League", abbr: "EPL", accent: "#35D07F", tw: "text-sport-soccer", order: 6 },
  UCL: { label: "Champions League", long: "UEFA Champions League", abbr: "UCL", accent: "#35D07F", tw: "text-sport-soccer", order: 7 },
  MLS: { label: "MLS", long: "Major League Soccer", abbr: "MLS", accent: "#35D07F", tw: "text-sport-soccer", order: 8 },
  NCAAF: { label: "College Football", long: "NCAA Football", abbr: "NCAAF", accent: "#FFC83D", tw: "text-sport-college", order: 9 },
  NCAAB: { label: "College Basketball", long: "NCAA Basketball", abbr: "NCAAB", accent: "#FFC83D", tw: "text-sport-college", order: 10 },
  CBB: { label: "College Baseball", long: "NCAA Baseball", abbr: "CBB", accent: "#FFC83D", tw: "text-sport-college", order: 11 },
  UFC: { label: "UFC", long: "UFC Main Card", abbr: "UFC", accent: "#FF3B3B", tw: "text-sport-ufc", order: 12 },
  GOLF: { label: "Golf", long: "Major Tournament", abbr: "GOLF", accent: "#69D2B0", tw: "text-sport-golf", order: 13 },
};

export function sportMeta(league: League): SportMeta {
  return SPORTS[league];
}
