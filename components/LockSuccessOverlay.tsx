"use client";

import Link from "next/link";
import { CheckCircle2, ImageIcon, ArrowRight } from "lucide-react";

export function LockSuccessOverlay({
  count,
  onClose,
}: {
  count: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-950/95 px-6 backdrop-blur-md">
      <div className="animate-scale-in flex w-full max-w-[420px] flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 -z-10 animate-pop rounded-full bg-lime/20 blur-2xl" />
          <CheckCircle2 className="h-20 w-20 text-lime" strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight">
          Your card is locked.
        </h1>
        <p className="mt-2 text-base text-ink-600">
          You picked <span className="tnum font-bold text-white">{count}</span>{" "}
          {count === 1 ? "game" : "games"}. Share your picks with friends.
        </p>

        <Link
          href="/share"
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime py-4 text-base font-extrabold uppercase tracking-wide text-ink-950 transition active:scale-95"
        >
          <ImageIcon className="h-5 w-5" strokeWidth={2.5} />
          Preview Share Card
        </Link>
        <button
          onClick={onClose}
          className="mt-3 flex items-center gap-1 py-2 text-sm font-semibold text-ink-600 transition hover:text-white/70"
        >
          Back to slate <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
