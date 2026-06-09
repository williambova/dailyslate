"use client";

import { Flame, Trophy, Sparkles, Star, Crown, Target } from "lucide-react";
import type { User } from "@/types";
import { useSlate, useSlateDerived } from "@/lib/store";
import { computeDailyRecord, deriveBadges, countByType } from "@/lib/scoring";
import { leaderboards } from "@/data/mockLeaderboard";
import { Badge } from "./Badge";
import { cn } from "@/lib/cn";

/**
 * Profile + lifetime stats. Lifetime numbers come from the mock user record;
 * "today" badges are derived live from the current card so the screen reacts
 * to picks made this session. Recent results are illustrative mock history.
 */

// MOCK — last 7 daily cards (most recent first). Later: query finished cards.
const RECENT: { day: string; record: string; won: boolean }[] = [
  { day: "Today", record: "—", won: true },
  { day: "Sat", record: "9/12", won: true },
  { day: "Fri", record: "7/11", won: false },
  { day: "Thu", record: "10/12", won: true },
  { day: "Wed", record: "8/13", won: false },
  { day: "Tue", record: "11/12", won: true },
  { day: "Mon", record: "9/12", won: true },
];

// MOCK — pick-type accuracy + best/worst sport. Later: aggregate from picks.
const ACCURACY = {
  favorite: 68,
  underdog: 41,
  bestSport: "NHL",
  worstSport: "MLS",
};

export function ProfileStats({ user }: { user: User }) {
  const { games, picks } = useSlate();
  const { picksList } = useSlateDerived();

  const record = computeDailyRecord(picksList, games);
  const badges = deriveBadges(record, picksList, games, user.currentStreak);
  const { favorites, underdogs } = countByType(picksList);

  const me = (scope: "today" | "week" | "all") =>
    leaderboards[scope].find((e) => e.userId === user.id)?.winPercentage ?? 0;

  return (
    <div className="space-y-5">
      {/* Identity + headline win% */}
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
        <div className="text-right">
          <div className="tnum text-3xl font-extrabold leading-none text-lime">
            {user.overallWinPercentage}
            <span className="text-base text-ink-600">%</span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-ink-600">
            All-time
          </div>
        </div>
      </div>

      {/* Badges earned today */}
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

      {/* Core stat grid */}
      <div>
        <SectionLabel>Career</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          <StatTile
            icon={Flame}
            tint="#FF7A1A"
            value={`${user.currentStreak}`}
            label="Day streak"
          />
          <StatTile
            icon={Trophy}
            tint="#C6F24E"
            value={user.bestDailyRecord}
            label="Best daily card"
          />
          <StatTile
            icon={Sparkles}
            tint="#4D9FFF"
            value={`${user.perfectDays}`}
            label="Perfect days"
          />
          <StatTile
            icon={Star}
            tint="#FFC83D"
            value={user.favoriteSport}
            label="Favorite sport"
          />
        </div>
      </div>

      {/* Win% by window */}
      <div>
        <SectionLabel>Win rate</SectionLabel>
        <div className="grid grid-cols-3 gap-2.5">
          <MiniPct value={me("today")} label="Today" />
          <MiniPct value={me("week")} label="This week" />
          <MiniPct value={me("all")} label="All-time" />
        </div>
      </div>

      {/* Pick tendencies */}
      <div>
        <SectionLabel>Accuracy</SectionLabel>
        <div className="space-y-2.5 rounded-2xl border border-line bg-ink-850/60 p-4">
          <AccuracyRow
            icon={Crown}
            tint="#C6F24E"
            label="Favorites"
            pct={ACCURACY.favorite}
          />
          <AccuracyRow
            icon={Target}
            tint="#A875FF"
            label="Underdogs"
            pct={ACCURACY.underdog}
          />
          <div className="flex justify-between border-t border-line pt-3 text-[12px] font-semibold text-ink-600">
            <span>
              Best: <span className="text-white/85">{ACCURACY.bestSport}</span>
            </span>
            <span>
              Toughest:{" "}
              <span className="text-white/85">{ACCURACY.worstSport}</span>
            </span>
          </div>
        </div>
      </div>

      {/* This card's strategy */}
      {picksList.length > 0 && (
        <div>
          <SectionLabel>Today&apos;s card</SectionLabel>
          <div className="flex items-center justify-between rounded-2xl border border-line bg-ink-850/60 p-4 text-sm">
            <span className="font-semibold text-ink-600">Pick strategy</span>
            <span className="tnum font-bold">
              {favorites} fav · {underdogs} dog
              {record.completed > 0 && (
                <span className="ml-2 text-lime">
                  {record.correct}/{record.completed} so far
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Recent results */}
      <div>
        <SectionLabel>Recent results</SectionLabel>
        <div className="flex gap-1.5">
          {RECENT.map((r) => (
            <div key={r.day} className="flex-1 text-center">
              <div
                className={cn(
                  "grid h-9 place-items-center rounded-lg text-[11px] font-extrabold tnum",
                  r.record === "—"
                    ? "border border-dashed border-line text-ink-600"
                    : r.won
                      ? "bg-lime/15 text-lime"
                      : "bg-ink-800 text-ink-600"
                )}
              >
                {r.record === "—" ? "·" : r.won ? "W" : "L"}
              </div>
              <div className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-ink-600">
                {r.day}
              </div>
            </div>
          ))}
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

function StatTile({
  icon: Icon,
  tint,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  tint: string;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-ink-850/60 p-4">
      <Icon className="h-5 w-5" style={{ color: tint }} />
      <div className="mt-3 truncate text-xl font-extrabold tracking-tight">
        {value}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-600">
        {label}
      </div>
    </div>
  );
}

function MiniPct({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-ink-850/60 p-3 text-center">
      <div className="tnum text-xl font-extrabold">
        {value}
        <span className="text-xs text-ink-600">%</span>
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-600">
        {label}
      </div>
    </div>
  );
}

function AccuracyRow({
  icon: Icon,
  tint,
  label,
  pct,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  tint: string;
  label: string;
  pct: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0" style={{ color: tint }} />
      <span className="w-20 shrink-0 text-sm font-semibold">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-800">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: tint }}
        />
      </div>
      <span className="tnum w-9 shrink-0 text-right text-sm font-bold">
        {pct}%
      </span>
    </div>
  );
}
