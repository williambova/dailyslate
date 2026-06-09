"use client";

import Link from "next/link";
import { Check, X, Lock, Radio, ImageIcon, Clock } from "lucide-react";
import { useSlate, useSlateDerived } from "@/lib/store";
import { sportMeta } from "@/lib/sportConfig";
import { computeDailyRecord, isPickCorrect } from "@/lib/scoring";
import { gameTime } from "@/lib/date";
import { Pill } from "@/components/Badge";
import { cn } from "@/lib/cn";

/**
 * My Picks (#5) — every pick the user has made today with live result state.
 * Pending finals roll up into a daily record at the top; a CTA links to the
 * share card once anything is picked.
 */
export default function MyPicksPage() {
  const { games, picks } = useSlate();
  const { picksList } = useSlateDerived();
  const byId = new Map(games.map((g) => [g.id, g]));

  const record = computeDailyRecord(picksList, games);

  // Order: live first, then final, then everything else by game importance.
  const rows = [...picksList].sort((a, b) => {
    const ga = byId.get(a.gameId)!;
    const gb = byId.get(b.gameId)!;
    const rank = (s: string) =>
      s === "live" ? 0 : s === "final" ? 1 : 2;
    return rank(ga.status) - rank(gb.status) || ga.displayImportance - gb.displayImportance;
  });

  if (picksList.length === 0) {
    return (
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-extrabold tracking-tight">My Picks</h1>
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-ink-850/40 p-10 text-center">
          <p className="text-sm text-ink-600">
            You haven&apos;t made any picks yet.
          </p>
          <Link
            href="/slate"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-ink-950"
          >
            Go to today&apos;s slate
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">My Picks</h1>
        <span className="tnum text-sm font-bold text-ink-600">
          {picksList.length} games
        </span>
      </div>

      {/* Daily record summary */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-ink-850/60 p-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-600">
            Today&apos;s record
          </div>
          <div className="tnum mt-0.5 text-2xl font-extrabold">
            {record.correct}
            <span className="text-ink-600">/{record.completed}</span>
            {record.pending > 0 && (
              <span className="ml-2 text-[12px] font-semibold text-ink-600">
                {record.pending} pending
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="tnum text-3xl font-extrabold leading-none text-lime">
            {record.winPct}
            <span className="text-base text-ink-600">%</span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-ink-600">
            Win rate
          </div>
        </div>
      </div>

      {/* Pick rows */}
      <div className="mt-4 space-y-2.5">
        {rows.map((p) => {
          const g = byId.get(p.gameId)!;
          const m = sportMeta(g.league);
          const correct = isPickCorrect(p, g);
          return (
            <div
              key={p.id}
              className="overflow-hidden rounded-2xl border border-line bg-ink-850/60"
              style={{ borderLeft: `3px solid ${m.accent}` }}
            >
              <div className="flex items-center gap-3 p-3.5">
                <span
                  className="grid h-9 w-12 shrink-0 place-items-center rounded-lg text-[10px] font-extrabold"
                  style={{ background: `${m.accent}1A`, color: m.accent }}
                >
                  {m.abbr}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">
                    {g.awayTeam}{" "}
                    <span className="text-ink-600">@</span> {g.homeTeam}
                  </div>
                  <div className="mt-0.5 truncate text-[12px] font-semibold text-ink-600">
                    Pick: <span className="text-white/90">{p.selectedTeam}</span>
                    <span className="ml-1.5 capitalize text-ink-600/70">
                      · {p.pickType}
                    </span>
                  </div>
                </div>

                <StatusTag game={g} correct={correct} locked={p.isLocked} />
              </div>

              {(g.status === "live" || g.status === "final") && (
                <div className="flex items-center justify-between border-t border-line bg-ink-900/40 px-3.5 py-2 text-[12px]">
                  <span className="tnum font-semibold text-ink-600">
                    {g.awayTeam} {g.awayScore} · {g.homeTeam} {g.homeScore}
                  </span>
                  {g.status === "final" && g.winner && (
                    <span className="font-bold">
                      {g.winner} win
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Link
        href="/share"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-electric py-4 text-base font-extrabold uppercase tracking-wide text-white transition active:scale-95"
      >
        <ImageIcon className="h-5 w-5" strokeWidth={2.5} />
        Preview share card
      </Link>
    </div>
  );
}

function StatusTag({
  game,
  correct,
  locked,
}: {
  game: { status: string; startTime: string };
  correct: boolean | null;
  locked: boolean;
}) {
  if (game.status === "final") {
    return correct ? (
      <Pill tone="lime">
        <Check className="h-3.5 w-3.5" /> Correct
      </Pill>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-400">
        <X className="h-3.5 w-3.5" /> Missed
      </span>
    );
  }
  if (game.status === "live") {
    return (
      <Pill tone="live">
        <Radio className="h-3.5 w-3.5 animate-pulse" /> Live
      </Pill>
    );
  }
  return locked ? (
    <Pill tone="muted">
      <Lock className="h-3 w-3" /> Locked
    </Pill>
  ) : (
    <Pill tone="muted">
      <Clock className="h-3 w-3" /> {gameTime(game.startTime)}
    </Pill>
  );
}
