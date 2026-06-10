import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { League } from "@/types";
import {
  fetchLeague,
  easternYyyymmdd,
  easternYyyymmddDaysAgo,
  slateKeyFromYyyymmdd,
  ESPN_ENDPOINTS,
} from "@/lib/espn";

/**
 * GET /api/grade?date=YYYYMMDD   (no date → grades YESTERDAY, Eastern)
 *
 * Pulls that day's scoreboard from ESPN, keeps only FINAL games with a
 * winner, and upserts them into public.results using the service-role key
 * (server-only, bypasses RLS — clients can never write results).
 *
 * Idempotent and safe to call repeatedly: re-grading a day just overwrites
 * the same rows. Triggered two ways:
 *   1. Vercel Cron daily (see vercel.json) for yesterday.
 *   2. Lazily from the leaderboard/profile when a past day with picks has
 *      no results yet (covers cron-misses and backfills history).
 */

export const revalidate = 0;

const LEAGUES = Object.keys(ESPN_ENDPOINTS) as League[];

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Grading not configured: missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 501 }
    );
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const yyyymmdd =
    dateParam && /^\d{8}$/.test(dateParam)
      ? dateParam
      : easternYyyymmddDaysAgo(1);

  // Refuse future dates (nothing to grade).
  if (yyyymmdd > easternYyyymmdd()) {
    return NextResponse.json({ date: yyyymmdd, graded: 0, note: "future date" });
  }

  const slateDate = slateKeyFromYyyymmdd(yyyymmdd);

  const perLeague = await Promise.all(
    LEAGUES.map((lg) => fetchLeague(lg, yyyymmdd, 50))
  );

  const rows = perLeague
    .flat()
    .filter((g) => g.status === "final" && g.winner)
    .map((g) => ({
      slate_date: slateDate,
      game_id: g.id,
      league: g.league,
      winner: g.winner as string,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ date: yyyymmdd, graded: 0 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { error } = await admin
    .from("results")
    .upsert(rows, { onConflict: "slate_date,game_id" });

  if (error) {
    return NextResponse.json(
      { date: yyyymmdd, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ date: yyyymmdd, graded: rows.length });
}
