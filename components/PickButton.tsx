"use client";

import { Check, Lock, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type PickResult = "correct" | "wrong" | null;

interface PickButtonProps {
  team: string;
  selected: boolean;
  /** Not changeable (card locked, or game live/final). */
  disabled?: boolean;
  /** Card locked but still showing the selection. */
  locked?: boolean;
  /** Final result for THIS user's pick on this team. */
  result?: PickResult;
  /** Final: did this team actually win? (dims the loser). */
  isWinner?: boolean;
  accent: string;
  onClick?: () => void;
}

export function PickButton({
  team,
  selected,
  disabled,
  locked,
  result,
  isWinner,
  accent,
  onClick,
}: PickButtonProps) {
  const correct = result === "correct";
  const wrong = result === "wrong";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "group relative flex h-[58px] w-full items-center justify-center rounded-xl border px-3 text-center transition-all duration-150 active:scale-[0.98]",
        "disabled:active:scale-100",
        // base
        !selected && !correct && !wrong && "border-line bg-ink-800 text-white/85",
        !selected && !disabled && "hover:border-white/20 hover:bg-ink-750",
        // selected (open / locked, no result yet)
        selected && !correct && !wrong && "border-lime bg-lime/12 text-white shadow-glow",
        // final results
        correct && "border-lime bg-lime/15 text-white",
        wrong && "border-red-500/60 bg-red-500/10 text-white/90",
        // dim losing side once final
        isWinner === false && !selected && "opacity-45"
      )}
      style={
        selected && !correct && !wrong
          ? { boxShadow: `0 0 0 1px ${accent}55, 0 8px 26px -10px ${accent}66` }
          : undefined
      }
    >
      <span
        className={cn(
          "truncate text-[15px] font-bold leading-tight",
          selected && "text-white"
        )}
      >
        {team}
      </span>

      {/* status indicator */}
      <span className="absolute right-2 top-2">
        {correct && <Check className="h-4 w-4 text-lime" strokeWidth={3} />}
        {wrong && <X className="h-4 w-4 text-red-400" strokeWidth={3} />}
        {!correct && !wrong && selected && locked && (
          <Lock className="h-3.5 w-3.5 text-lime/80" />
        )}
        {!correct && !wrong && selected && !locked && (
          <span className="grid h-4 w-4 place-items-center rounded-full bg-lime text-ink-950">
            <Check className="h-3 w-3" strokeWidth={3.5} />
          </span>
        )}
      </span>
    </button>
  );
}
