"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";

/**
 * Leaderboard (#7). With no mock friends and no backend yet, there's nothing
 * to rank. Real leaderboards populate once you create/join a group (and, for
 * cross-device standings, once accounts are wired via Supabase).
 */
export default function LeaderboardPage() {
  return (
    <div className="px-4 pb-4 pt-4 lg:mx-auto lg:max-w-[640px]">
      <h1 className="text-2xl font-extrabold tracking-tight">Leaderboard</h1>
      <p className="mt-1 text-[13px] font-medium text-ink-600">
        Ranked by win percentage.
      </p>

      <div className="mt-6 rounded-3xl border border-dashed border-line bg-ink-850/40 p-10 text-center">
        <Trophy className="mx-auto h-8 w-8 text-ink-600" />
        <p className="mt-3 text-sm font-semibold">No standings yet.</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
          Leaderboards come alive once you&apos;re in a group. Create one and
          invite friends to start competing on accuracy and streaks.
        </p>
        <Link
          href="/groups"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-ink-950"
        >
          Go to groups
        </Link>
      </div>
    </div>
  );
}
