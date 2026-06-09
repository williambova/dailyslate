"use client";

import { useState } from "react";
import type { LeaderboardScope } from "@/types";
import { leaderboards } from "@/data/mockLeaderboard";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { cn } from "@/lib/cn";

/**
 * Leaderboard (#7) — Today / This Week / All-Time. Each scope is a separate
 * mock dataset; later these become server-computed aggregates over the picks
 * table joined to final games.
 */
const TABS: { key: LeaderboardScope; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "all", label: "All-Time" },
];

export default function LeaderboardPage() {
  const [scope, setScope] = useState<LeaderboardScope>("today");

  return (
    <div className="px-4 pb-4 pt-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Leaderboard</h1>
      <p className="mt-1 text-[13px] font-medium text-ink-600">
        Ranked by win percentage.
      </p>

      {/* Scope tabs */}
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-ink-850/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setScope(t.key)}
            className={cn(
              "rounded-xl py-2 text-[13px] font-bold transition",
              scope === t.key
                ? "bg-lime text-ink-950"
                : "text-ink-600 hover:text-white/80"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <LeaderboardTable entries={leaderboards[scope]} />
      </div>

      {scope === "today" && (
        <p className="mt-4 text-center text-[11px] text-ink-600">
          Today reflects friends with completed games so far. Standings update
          as the slate finishes.
        </p>
      )}
    </div>
  );
}
