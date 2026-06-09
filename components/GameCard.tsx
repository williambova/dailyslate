"use client";

import { Radio, Lock, Star } from "lucide-react";
import type { Game } from "@/types";
import { sportMeta } from "@/lib/sportConfig";
import { gameTime } from "@/lib/date";
import { cn } from "@/lib/cn";
import { useSlate } from "@/lib/store";
import { PickButton, type PickResult } from "./PickButton";

function LeagueChip({ league }: { league: Game["league"] }) {
  const m = sportMeta(league);
  return (
    <span
      className="rounded-md px-2 py-[3px] text-[10px] font-extrabold uppercase tracking-wider"
      style={{ color: m.accent, background: `${m.accent}1A` }}
    >
      {m.abbr}
    </span>
  );
}

export function GameCard({ game }: { game: Game }) {
  const { picks, selectTeam, isEditable, cardLocked } = useSlate();
  const pick = picks[game.id];
  const selected = pick?.selectedTeam;
  const m = sportMeta(game.league);
  const editable = isEditable(game);
  const isFinal = game.status === "final";
  const isLive = game.status === "live";
  const locked = !editable && !!selected;

  const resultFor = (team: string): PickResult => {
    if (!isFinal || !game.winner || selected !== team) return null;
    return game.winner === team ? "correct" : "wrong";
  };
  const isWinnerFor = (team: string) =>
    isFinal && game.winner ? game.winner === team : undefined;

  const hasScore = game.homeScore !== null && game.awayScore !== null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-ink-850/70 p-3 shadow-card transition-colors",
        game.displayImportance === 1 && "border-white/[0.14]"
      )}
    >
      {/* header */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LeagueChip league={game.league} />
          {game.displayImportance === 1 && (
            <Star className="h-3.5 w-3.5 text-lime" fill="currentColor" />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold">
          {isLive && (
            <span className="flex items-center gap-1 text-red-400">
              <Radio className="h-3 w-3 animate-pulse" /> LIVE
            </span>
          )}
          {isFinal && <span className="text-ink-600">FINAL</span>}
          {locked && !isLive && !isFinal && (
            <span className="flex items-center gap-1 text-lime/80">
              <Lock className="h-3 w-3" /> LOCKED
            </span>
          )}
          {game.status === "open" && (
            <span className="tnum text-ink-600">{gameTime(game.startTime)}</span>
          )}
        </div>
      </div>

      {/* matchup */}
      <div className="relative grid grid-cols-2 gap-2.5">
        <PickButton
          team={game.awayTeam}
          selected={selected === game.awayTeam}
          disabled={!editable}
          locked={locked}
          result={resultFor(game.awayTeam)}
          isWinner={isWinnerFor(game.awayTeam)}
          accent={m.accent}
          onClick={() => selectTeam(game.id, game.awayTeam)}
        />
        <PickButton
          team={game.homeTeam}
          selected={selected === game.homeTeam}
          disabled={!editable}
          locked={locked}
          result={resultFor(game.homeTeam)}
          isWinner={isWinnerFor(game.homeTeam)}
          accent={m.accent}
          onClick={() => selectTeam(game.id, game.homeTeam)}
        />
        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-ink-900 px-1.5 py-0.5 text-[9px] font-bold uppercase text-ink-600">
          @
        </span>
      </div>

      {/* footer: score / result line */}
      {(isLive || isFinal) && (
        <div className="mt-2.5 flex items-center justify-center gap-2 text-xs">
          {hasScore ? (
            <span className="tnum font-semibold text-white/80">
              {game.awayTeam} {game.awayScore}
              <span className="mx-1.5 text-ink-600">—</span>
              {game.homeScore} {game.homeTeam}
            </span>
          ) : (
            isFinal &&
            game.winner && (
              <span className="font-semibold text-white/80">
                {game.winner} def.{" "}
                {game.winner === game.homeTeam ? game.awayTeam : game.homeTeam}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}
