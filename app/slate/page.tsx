"use client";

import { useMemo, useState } from "react";
import { Radio } from "lucide-react";
import type { Game, League } from "@/types";
import { useSlate, useSlateDerived } from "@/lib/store";
import { sportMeta } from "@/lib/sportConfig";
import { headerDate } from "@/lib/date";
import { SportSection } from "@/components/SportSection";
import { LockPicksBar } from "@/components/LockPicksBar";
import { LockPicksModal } from "@/components/LockPicksModal";
import { LockSuccessOverlay } from "@/components/LockSuccessOverlay";

/**
 * Today's Slate (#2) — the core picking surface. Games (real, from ESPN via
 * /api/slate, or mock fallback) are grouped by league and ordered via
 * sportConfig. The sticky bar drives the lock flow.
 */
export default function SlatePage() {
  const { games, picks, date, lockPicks, loading, source } = useSlate();
  const { made, total } = useSlateDerived();

  const [modalOpen, setModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const unlockedCount = useMemo(
    () => Object.values(picks).filter((p) => !p.isLocked).length,
    [picks]
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

  const isPartial = made < total;
  const pct = total > 0 ? Math.round((made / total) * 100) : 0;

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
          <SourcePill source={source} />
        </div>
        <p className="mt-1 text-[13px] font-medium text-ink-600">
          {headerDate(date)}
        </p>

        {!loading && total > 0 && (
          <div className="mt-3.5">
            <div className="mb-1.5 flex items-center justify-between text-[12px] font-bold">
              <span className="tnum">
                {made} of {total} picks made
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
      ) : total === 0 ? (
        <EmptySlate />
      ) : (
        <div className="space-y-6">
          {sections.map(([league, leagueGames]) => (
            <SportSection key={league} league={league} games={leagueGames} />
          ))}
        </div>
      )}

      {/* Sticky lock bar */}
      {!loading && total > 0 && (
        <LockPicksBar
          made={made}
          total={total}
          unlockedCount={unlockedCount}
          cardLocked={Object.values(picks).some((p) => p.isLocked)}
          onLock={() => setModalOpen(true)}
        />
      )}

      <LockPicksModal
        open={modalOpen}
        lockingCount={unlockedCount}
        total={total}
        isPartial={isPartial}
        onCancel={() => setModalOpen(false)}
        onConfirm={confirmLock}
      />

      {showSuccess && (
        <LockSuccessOverlay count={made} onClose={() => setShowSuccess(false)} />
      )}
    </div>
  );
}

function SourcePill({ source }: { source: "live" | "mock" | "loading" }) {
  if (source === "loading") {
    return (
      <span className="rounded-full border border-line bg-ink-850 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-600">
        Loading
      </span>
    );
  }
  if (source === "live") {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-lime/40 bg-lime/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-lime">
        <Radio className="h-3 w-3 animate-pulse" /> Live
      </span>
    );
  }
  return (
    <span className="rounded-full border border-line bg-ink-850 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-600">
      Demo data
    </span>
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

function EmptySlate() {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-ink-850/40 p-10 text-center">
      <p className="text-sm font-semibold">No games on the slate today.</p>
      <p className="mt-1 text-[13px] text-ink-600">
        Check back when the next day&apos;s schedule is posted.
      </p>
    </div>
  );
}
