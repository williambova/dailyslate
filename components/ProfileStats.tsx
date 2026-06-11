"use client";

import { useEffect, useState } from "react";
import { Sparkles, Target, TrendingUp } from "lucide-react";
import type { User } from "@/types";
import { useSlate, useSlateDerived } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  dailyRecords,
  ensureGraded,
  fetchPicksRange,
  fetchResultsRange,
  recentSlateKeys,
} from "@/lib/history";
import { computeDailyRecord, deriveBadges, countByType } from "@/lib/scoring";
import { Badge } from "./Badge";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/cn";

interface DayRec {
  slateDate: string;
  correct: number;
  completed: number;
  locked: number;
}

/**
 * Profile + stats. Everything here is derived from the user's REAL activity.
 * A fresh user has no history, so we show today's card (if any) plus an
 * honest empty state instead of fabricated lifetime numbers. Lifetime stats
 * accrue once accounts persist results (Supabase).
 */
export function ProfileStats({ user }: { user: User }) {
  const { games, slateKey } = useSlate();
  const { picksList } = useSlateDerived();
  const { isAuthed, authUserId } = useAuth();

  const record = computeDailyRecord(picksList, games);
  const badges = deriveBadges(record, picksList, games, user.currentStreak);
  const { favorites, underdogs } = countByType(picksList);
  const hasPicks = picksList.length > 0;

  // Real 7-day history (authed only; grades against stored results).
  const [history, setHistory] = useState<DayRec[]>([]);
  useEffect(() => {
    if (!isAuthed || !authUserId || !slateKey) return;
    let active = true;
    (async () => {
      try {
        const dates = recentSlateKeys(7);
        let [picks, results] = await Promise.all([
          fetchPicksRange([authUserId], dates),
          fetchResultsRange(dates),
        ]);
        if (await ensureGraded(picks, results, slateKey)) {
          results = await fetchResultsRange(dates);
        }
        if (active) setHistory(dailyRecords(picks, results, slateKey, games));
      } catch {
        /* leave empty */
      }
    })();
    return () => {
      active = false;
    };
  }, [isAuthed, authUserId, slateKey, games]);

  const totals = history.reduce(
    (acc, d) => ({
      correct: acc.correct + d.correct,
      completed: acc.completed + d.completed,
    }),
    { correct: 0, completed: 0 }
  );
  const weekPct =
    totals.completed > 0
      ? Math.round((totals.correct / totals.completed) * 100)
      : null;

  return (
    <div className="space-y-5">
      {/* Identity */}
      <div className="flex items-center gap-4 rounded-3xl border border-line bg-ink-850/60 p-5">
        <Avatar
          name={user.name}
          initials={user.avatar}
          url={user.avatarUrl}
          size={64}
          square
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold tracking-tight">
            {user.name}
          </h1>
          <p className="text-sm font-medium text-ink-600">@{user.username}</p>
        </div>
        {weekPct !== null && (
          <div className="text-right">
            <div className="tnum text-3xl font-extrabold leading-none text-lime">
              {weekPct}
              <span className="text-base text-ink-600">%</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink-600">
              7-day win
            </div>
          </div>
        )}
      </div>

      {/* Last 7 days (real, graded) */}
      {history.length > 0 && (
        <div>
          <SectionLabel>Last 7 days</SectionLabel>
          <div className="space-y-1.5">
            {history.map((d) => {
              const pct =
                d.completed > 0
                  ? Math.round((d.correct / d.completed) * 100)
                  : null;
              const label = new Date(d.slateDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  key={d.slateDate}
                  className="flex items-center justify-between rounded-xl border border-line bg-ink-850/60 px-3.5 py-2.5 text-sm"
                >
                  <span className="font-semibold text-ink-600">{label}</span>
                  <span className="tnum font-bold">
                    {d.completed > 0 ? (
                      <>
                        {d.correct}/{d.completed}
                        <span
                          className={cn(
                            "ml-2",
                            pct !== null && pct >= 50 ? "text-lime" : "text-ink-600"
                          )}
                        >
                          {pct}%
                        </span>
                      </>
                    ) : (
                      <span className="text-ink-600">{d.locked} locked · pending</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
      ) : history.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-ink-850/40 p-10 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-ink-600" />
          <p className="mt-3 text-sm font-semibold">No history yet.</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
            Make picks on today&apos;s slate and your record, streak, and badges
            will start building here.
          </p>
        </div>
      ) : null}

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
