"use client";

import { useMemo, useState } from "react";
import { Radio, RefreshCw, CalendarX, Activity, Lock } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import type { Game, League } from "@/types";
import { useSlate, useSlateDerived } from "@/lib/store";
import { sportMeta } from "@/lib/sportConfig";
import { headerDate } from "@/lib/date";
import { SportSection } from "@/components/SportSection";
import { LockPicksBar } from "@/components/LockPicksBar";
import { LockPicksModal } from "@/components/LockPicksModal";
import { LockSuccessOverlay } from "@/components/LockSuccessOverlay";

/**
 * Today's Slate (#2) — real games from ESPN via /api/slate. Open games are
 * pickable; games that have started or finished show as locked. No mock data:
 * empty and error states are explicit.
 */
export default function SlatePage() {
  const { games, picks, date, lockPicks, loading, source, reload } = useSlate();
  const { made, total } = useSlateDerived();

  const [modalOpen, setModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const unlockedCount = useMemo(
    () => Object.values(picks).filter((p) => !p.isLocked).length,
    [picks]
  );

  // Only "open" games count toward the pickable total / progress, and only
  // picks ON open games count as "made" (picks on started games would push
  // the ratio past 100%).
  const openTotal = useMemo(
    () => games.filter((g) => g.status === "open").length,
    [games]
  );
  const madeOpen = useMemo(() => {
    const open = new Set(
      games.filter((g) => g.status === "open").map((g) => g.id)
    );
    return Object.keys(picks).filter((gid) => open.has(gid)).length;
  }, [games, picks]);

  // Three zones, top to bottom: (1) games you can still act on, grouped by
  // sport; (2) your locked-in picks waiting for tip-off; (3) in progress &
  // final. Nothing you can't touch ever sits above something you can.
  const sections = useMemo(() => {
    const byLeague = new Map<League, Game[]>();
    for (const g of games) {
      if (g.status !== "open") continue;
      if (picks[g.id]?.isLocked) continue; // locked-in → its own zone below
      const arr = byLeague.get(g.league) ?? [];
      arr.push(g);
      byLeague.set(g.league, arr);
    }
    return Array.from(byLeague.entries()).sort(
      ([a], [b]) => sportMeta(a).order - sportMeta(b).order
    );
  }, [games, picks]);

  const lockedIn = useMemo(
    () =>
      games
        .filter((g) => g.status === "open" && picks[g.id]?.isLocked)
        .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime)),
    [games, picks]
  );

  const startedGames = useMemo(() => {
    const rank = (s: string) => (s === "live" ? 0 : 1); // live first, then finals
    return games
      .filter((g) => g.status === "live" || g.status === "final")
      .sort(
        (a, b) =>
          rank(a.status) - rank(b.status) ||
          +new Date(a.startTime) - +new Date(b.startTime)
      );
  }, [games]);

  const pct =
    openTotal > 0 ? Math.min(100, Math.round((madeOpen / openTotal) * 100)) : 0;

  const confirmLock = () => {
    lockPicks();
    setModalOpen(false);
    setShowSuccess(true);
  };

  return (
    <div className="px-4 pb-2 pt-4">
      {/* Date + progress */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight lg:text-3xl">
            Today&apos;s Slate
          </h1>
          {source === "live" && (
            <span className="flex items-center gap-1.5 rounded-full border border-lime/40 bg-lime/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-lime">
              <Radio className="h-3 w-3 animate-pulse" /> Live
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] font-medium text-ink-600">
          {headerDate(date)}
        </p>

        {source === "live" && openTotal > 0 && (
          <div className="mt-3.5">
            <div className="mb-1.5 flex items-center justify-between text-[12px] font-bold">
              <span className="tnum">
                {madeOpen} of {openTotal} picks made
                {startedGames.length > 0 && (
                  <span className="ml-1.5 font-semibold text-ink-600">
                    · {startedGames.length} started
                  </span>
                )}
              </span>
              <span className="text-ink-600">{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lime to-electric transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <LoadingSlate />
      ) : source === "error" ? (
        <ErrorSlate onRetry={reload} />
      ) : total === 0 ? (
        <EmptySlate onRetry={reload} />
      ) : (
        <div className="space-y-6">
          {/* Still pickable */}
          {sections.map(([league, leagueGames]) => (
            <SportSection key={league} league={league} games={leagueGames} />
          ))}

          {sections.length === 0 && lockedIn.length > 0 && (
            <div className="rounded-2xl border border-dashed border-lime/30 bg-lime/[0.05] p-5 text-center text-[13px] text-lime/90">
              Card locked. Nothing to do but watch — good luck. 🤞
            </div>
          )}

          {sections.length === 0 && lockedIn.length === 0 && startedGames.length > 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-ink-850/40 p-5 text-center text-[13px] text-ink-600">
              All of today&apos;s games have started — picks are locked. Come
              back in the morning for tomorrow&apos;s slate.
            </div>
          )}

          {/* Locked in — your picks, waiting on tip-off */}
          {lockedIn.length > 0 && (
            <div>
              <div className="mb-2.5 flex items-center gap-2 px-0.5">
                <Lock className="h-4 w-4 text-lime" />
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-ink-600">
                  Locked in
                </h2>
                <span className="tnum text-xs font-bold text-ink-600">
                  {lockedIn.length}
                </span>
              </div>
              <div className="grid gap-2.5 lg:grid-cols-2">
                {lockedIn.map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </div>
            </div>
          )}

          {/* Started games, separated so they never mix with pickable ones */}
          {startedGames.length > 0 && (
            <div>
              <div className="mb-2.5 flex items-center gap-2 px-0.5">
                <Activity className="h-4 w-4 text-ink-600" />
                <h2 className="text-xs font-extrabold uppercase tracking-wide text-ink-600">
                  In progress &amp; final
                </h2>
                <span className="tnum text-xs font-bold text-ink-600">
                  {startedGames.length}
                </span>
              </div>
              <div className="grid gap-2.5 opacity-80 lg:grid-cols-2">
                {startedGames.map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lock bar only when there's something pickable */}
      {!loading && source === "live" && openTotal > 0 && (
        <LockPicksBar
          made={madeOpen}
          total={openTotal}
          unlockedCount={unlockedCount}
          cardLocked={Object.values(picks).some((p) => p.isLocked)}
          onLock={() => setModalOpen(true)}
        />
      )}

      <LockPicksModal
        open={modalOpen}
        lockingCount={unlockedCount}
        total={openTotal}
        isPartial={madeOpen < openTotal}
        onCancel={() => setModalOpen(false)}
        onConfirm={confirmLock}
      />

      {showSuccess && (
        <LockSuccessOverlay count={made} onClose={() => setShowSuccess(false)} />
      )}
    </div>
  );
}

function LoadingSlate() {
  return (
    <div className="grid gap-2.5 lg:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[104px] animate-pulse rounded-2xl border border-line bg-ink-850/50"
        />
      ))}
    </div>
  );
}

function EmptySlate({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-ink-850/40 p-10 text-center">
      <CalendarX className="mx-auto h-8 w-8 text-ink-600" />
      <p className="mt-3 text-sm font-semibold">No games on the slate today.</p>
      <p className="mt-1 text-[13px] text-ink-600">
        Check back when the next day&apos;s schedule is posted.
      </p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-line bg-ink-800 px-3.5 py-2 text-[13px] font-bold text-white/85"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Refresh
      </button>
    </div>
  );
}

function ErrorSlate({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-red-500/30 bg-red-500/[0.06] p-10 text-center">
      <p className="text-sm font-semibold">Couldn&apos;t load today&apos;s games.</p>
      <p className="mt-1 text-[13px] text-ink-600">
        The schedule service didn&apos;t respond. Try again in a moment.
      </p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-lime px-4 py-2 text-[13px] font-extrabold uppercase tracking-wide text-ink-950"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </button>
    </div>
  );
}
