"use client";

import { Flame, Sparkles } from "lucide-react";
import type { LeaderboardEntry } from "@/types";
import { CURRENT_USER } from "@/data/mockUsers";
import { cn } from "@/lib/cn";

function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1
      ? "bg-lime text-ink-950"
      : rank === 2
        ? "bg-white/80 text-ink-950"
        : rank === 3
          ? "bg-sport-college text-ink-950"
          : "bg-ink-800 text-ink-600";
  return (
    <span
      className={cn(
        "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold tnum",
        medal
      )}
    >
      {rank}
    </span>
  );
}

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="space-y-2">
      {entries.map((e) => {
        const isMe = e.userId === CURRENT_USER.id;
        return (
          <div
            key={e.userId}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
              isMe
                ? "border-lime/40 bg-lime/[0.07]"
                : "border-line bg-ink-850/60"
            )}
          >
            <RankBadge rank={e.rank} />
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ink-700 to-ink-600 text-[11px] font-extrabold text-white/90">
              {e.avatar}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-bold">{e.name}</span>
                {isMe && (
                  <span className="rounded bg-lime/20 px-1.5 py-px text-[9px] font-bold uppercase text-lime">
                    You
                  </span>
                )}
                {e.perfectDay && (
                  <Sparkles className="h-3.5 w-3.5 text-lime" />
                )}
              </div>
              <div className="tnum text-[11px] font-medium text-ink-600">
                {e.picksCorrect}/{e.totalPicks} correct
                {e.streak > 0 && (
                  <span className="ml-2 inline-flex items-center gap-0.5 text-sport-nba">
                    <Flame className="h-3 w-3" />
                    {e.streak}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="tnum text-lg font-extrabold leading-none">
                {e.winPercentage}
                <span className="text-xs text-ink-600">%</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-600">
                Win
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
