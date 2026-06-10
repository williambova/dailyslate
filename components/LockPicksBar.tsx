"use client";

import Link from "next/link";
import { Lock, ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface LockPicksBarProps {
  made: number;
  total: number;
  unlockedCount: number; // picks selected but not yet locked
  cardLocked: boolean;
  onLock: () => void;
}

export function LockPicksBar({
  made,
  total,
  unlockedCount,
  cardLocked,
  onLock,
}: LockPicksBarProps) {
  const showLock = unlockedCount > 0;

  return (
    <div className="lock-bar-offset sticky z-20 px-4 lg:mx-auto lg:max-w-[680px]">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ink-800/95 p-2.5 pl-4 shadow-card backdrop-blur-xl">
        <div className="leading-tight">
          <div className="tnum text-sm font-extrabold">
            {made}/{total}{" "}
            <span className="font-semibold text-ink-600">picks made</span>
          </div>
          <div className="text-[11px] font-medium text-ink-600">
            {cardLocked
              ? unlockedCount > 0
                ? `${unlockedCount} new pick${unlockedCount > 1 ? "s" : ""} to lock`
                : "Card locked"
              : made === total
                ? "Full card ready"
                : "Lock anytime — pick later games until they start"}
          </div>
        </div>

        {showLock ? (
          <button
            onClick={onLock}
            className="flex items-center gap-1.5 rounded-xl bg-lime px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-ink-950 transition active:scale-95"
          >
            <Lock className="h-4 w-4" strokeWidth={2.5} />
            Lock Picks
          </button>
        ) : cardLocked ? (
          <Link
            href="/share"
            className="flex items-center gap-1.5 rounded-xl bg-electric px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white transition active:scale-95"
          >
            <ImageIcon className="h-4 w-4" strokeWidth={2.5} />
            Share Card
          </Link>
        ) : (
          <button
            disabled
            className={cn(
              "rounded-xl bg-ink-700 px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-ink-600"
            )}
          >
            Lock Picks
          </button>
        )}
      </div>
    </div>
  );
}
