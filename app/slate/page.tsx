"use client";

import { useMemo, useState } from "react";
import { Radio, RefreshCw, CalendarX } from "lucide-react";
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

  // Only "open" games count toward the pickable total / progress.
  const openTotal = useMemo(
    () => games.filter((g) => g.status === "open").length,
    [games]
  );

  const sections = useMemo(() => {
    const byLeague = new Map<League, Game[]>();
    for (const g of games) {
      const arr = byLeague.get(g.league) ?? [];
      arr.push(g);
      byLeague.set(g.league, arr);
    }
    return Array.from(byLeague.entries()).sort(
      ([a], [b]) => sportMeta(a).order - sportMeta(b).order
    );
  }, [games]);

  const pct = openTotal > 0 ? Math.round((made / openTotal) * 100) : 0;

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
                {made} of {openTotal} picks made
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
          {sections.map(([league, leagueGames]) => (
            <SportSection key={league} league={league} games={leagueGames} />
          ))}
        </div>
      )}

      {/* Lock bar only when there's something pickable */}
      {!loading && source === "live" && openTotal > 0 && (
        <LockPicksBar
          made={made}
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
        isPartial={made < openTotal}
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
