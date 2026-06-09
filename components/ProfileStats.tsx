"use client";

import { Sparkles, Target, TrendingUp } from "lucide-react";
import type { User } from "@/types";
import { useSlate, useSlateDerived } from "@/lib/store";
import { computeDailyRecord, deriveBadges, countByType } from "@/lib/scoring";
import { Badge } from "./Badge";

/**
 * Profile + stats. Everything here is derived from the user's REAL activity.
 * A fresh user has no history, so we show today's card (if any) plus an
 * honest empty state instead of fabricated lifetime numbers. Lifetime stats
 * accrue once accounts persist results (Supabase).
 */
export function ProfileStats({ user }: { user: User }) {
  const { games } = useSlate();
  const { picksList } = useSlateDerived();

  const record = computeDailyRecord(picksList, games);
  const badges = deriveBadges(record, picksList, games, user.currentStreak);
  const { favorites, underdogs } = countByType(picksList);
  const hasPicks = picksList.length > 0;

  return (
    <div className="space-y-5">
      {/* Identity */}
      <div className="flex items-center gap-4 rounded-3xl border border-line bg-ink-850/60 p-5">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-lime to-electric text-xl font-extrabold text-ink-950">
          {user.avatar}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold tracking-tight">
            {user.name}
          </h1>
          <p className="text-sm font-medium text-ink-600">@{user.username}</p>
        </div>
      </div>

      {/* Today's card — only if the user has actually picked */}
      {hasPicks ? (
        <>
          {badges.length > 0 && (
            <div>
              <SectionLabel>Today&apos;s badges</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <Badge key={b.key} badgeKey={b.key} label={b.label} />
                ))}
              </div>
            </div>
          )}

          <div>
            <SectionLabel>Today</SectionLabel>
            <div className="grid grid-cols-3 gap-2.5">
              <Tile value={`${picksList.length}`} label="Picks made" />
              <Tile
                value={
                  record.completed > 0
                    ? `${record.correct}/${record.completed}`
                    : "—"
                }
                label="Correct"
              />
              <Tile
                value={record.completed > 0 ? `${record.winPct}%` : "—"}
                label="Win rate"
              />
            </div>
          </div>

          <div>
            <SectionLabel>This card&apos;s strategy</SectionLabel>
            <div className="flex items-center justify-between rounded-2xl border border-line bg-ink-850/60 p-4 text-sm">
              <span className="font-semibold text-ink-600">Favorites vs underdogs</span>
              <span className="tnum font-bold">
                {favorites} fav · {underdogs} dog
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-line bg-ink-850/40 p-10 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-ink-600" />
          <p className="mt-3 text-sm font-semibold">No history yet.</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
            Make picks on today&apos;s slate and your record, streak, and badges
            will start building here.
          </p>
        </div>
      )}

      {/* What unlocks with an account */}
      <div className="rounded-2xl border border-line bg-ink-850/60 p-4">
        <SectionLabel>Coming with an account</SectionLabel>
        <div className="space-y-2 text-[13px] text-ink-600">
          <Row icon={TrendingUp} text="Lifetime win %, daily / weekly / all-time" />
          <Row icon={Sparkles} text="Streaks and perfect-day history that persist" />
          <Row icon={Target} text="Favorite vs underdog accuracy by sport" />
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 px-0.5 text-xs font-extrabold uppercase tracking-wide text-ink-600">
      {children}
    </h2>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-ink-850/60 p-4 text-center">
      <div className="tnum truncate text-xl font-extrabold tracking-tight">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-600">
        {label}
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-ink-600" />
      <span>{text}</span>
    </div>
  );
}
