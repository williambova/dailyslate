"use client";

import { useMemo, useState } from "react";
import type { Game, League } from "@/types";
import { useSlate, useSlateDerived } from "@/lib/store";
import { sportMeta } from "@/lib/sportConfig";
import { headerDate } from "@/lib/date";
import { SportSection } from "@/components/SportSection";
import { LockPicksBar } from "@/components/LockPicksBar";
import { LockPicksModal } from "@/components/LockPicksModal";
import { LockSuccessOverlay } from "@/components/LockSuccessOverlay";

/**
 * Today's Slate (#2) — the core picking surface. Games are grouped by league
 * and ordered via sportConfig. The sticky bar drives the lock flow: selecting
 * teams makes "unlocked" picks; locking them opens the confirmation modal,
 * then the success overlay.
 */
export default function SlatePage() {
  const { games, picks, date, lockPicks } = useSlate();
  const { made, total } = useSlateDerived();

  const [modalOpen, setModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Picks chosen this session that haven't been committed yet.
  const unlockedCount = useMemo(
    () => Object.values(picks).filter((p) => !p.isLocked).length,
    [picks]
  );

  // Group games by league, preserving sportConfig order.
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

  const lockedCommitting = unlockedCount;
  const isPartial = made < total;

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
          <h1 className="text-2xl font-extrabold tracking-tight">
            Today&apos;s Slate
          </h1>
          <span className="rounded-full border border-line bg-ink-850 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-lime">
            Today
          </span>
        </div>
        <p className="mt-1 text-[13px] font-medium text-ink-600">
          {headerDate(date)}
        </p>

        {/* Completion progress */}
        <div className="mt-3.5">
          <div className="mb-1.5 flex items-center justify-between text-[12px] font-bold">
            <span className="tnum">
              {made} of {total} picks made
            </span>
            <span className="text-ink-600">
              {Math.round((made / total) * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lime to-electric transition-all duration-500"
              style={{ width: `${(made / total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grouped games */}
      <div className="space-y-6">
        {sections.map(([league, leagueGames]) => (
          <SportSection key={league} league={league} games={leagueGames} />
        ))}
      </div>

      {/* Sticky lock bar */}
      <LockPicksBar
        made={made}
        total={total}
        unlockedCount={unlockedCount}
        cardLocked={Object.values(picks).some((p) => p.isLocked)}
        onLock={() => setModalOpen(true)}
      />

      <LockPicksModal
        open={modalOpen}
        lockingCount={lockedCommitting}
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
