"use client";

import { Lock, AlertTriangle } from "lucide-react";

interface LockPicksModalProps {
  open: boolean;
  lockingCount: number;
  total: number;
  isPartial: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LockPicksModal({
  open,
  lockingCount,
  total,
  isPartial,
  onCancel,
  onConfirm,
}: LockPicksModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative mx-3 mb-3 w-full max-w-[420px] animate-scale-in rounded-3xl border border-line bg-ink-850 p-6 shadow-card sm:mb-0">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-lime/12">
          <Lock className="h-6 w-6 text-lime" />
        </div>

        <h2 className="text-2xl font-extrabold tracking-tight">Lock your card?</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          Once games start, those picks can&apos;t be changed.
        </p>

        {isPartial && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-sport-college/30 bg-sport-college/10 p-3 text-[13px] text-sport-college">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              You&apos;re locking{" "}
              <strong className="tnum">{lockingCount}</strong> of {total} picks.
              You can still pick later games until they start.
            </span>
          </div>
        )}

        <div className="mt-6 flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-line bg-ink-800 py-3 text-sm font-bold text-white/85 transition active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-lime py-3 text-sm font-extrabold uppercase tracking-wide text-ink-950 transition active:scale-95"
          >
            Lock Picks
          </button>
        </div>
      </div>
    </div>
  );
}
