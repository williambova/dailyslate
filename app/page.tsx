import Link from "next/link";
import { ArrowRight, Lock, Share2, Trophy } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";

/**
 * Marketing landing (#1). Renders full-bleed (AppShell hides chrome here).
 * Mobile is a single focused column; desktop centers a larger hero with the
 * feature row beneath so it reads as an intentional desktop page.
 */
export default function HomePage() {
  return (
    <div className="app-bg flex min-h-screen flex-col px-6 pb-10 pt-8 lg:px-10">
      <div className="mx-auto w-full max-w-[1080px]">
        <Wordmark size="md" />
      </div>

      <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col justify-center py-12">
        <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-line bg-ink-850 px-3 py-1.5 text-[12px] font-semibold text-lime">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          Today&apos;s slate is live
        </span>

        <h1 className="text-[44px] font-extrabold leading-[0.95] tracking-tight lg:text-[80px]">
          Pick winners.
          <br />
          <span className="text-lime">Beat your friends.</span>
        </h1>

        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-600 lg:mt-7 lg:max-w-2xl lg:text-xl">
          The daily sports ritual. Call today&apos;s games, lock your card, and
          share a clean graphic to the group chat. It&apos;s Wordle for sports
          fans — accuracy, streaks, and bragging rights. No betting, ever.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-10">
          <Link
            href="/slate"
            className="flex items-center justify-center gap-2 rounded-2xl bg-lime px-8 py-4 text-base font-extrabold uppercase tracking-wide text-ink-950 transition active:scale-95 sm:w-auto"
          >
            Make your picks
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-ink-850 px-8 py-4 text-base font-bold text-white/85 transition active:scale-95 sm:w-auto"
          >
            See the leaderboard
          </Link>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1080px] grid-cols-3 gap-3 lg:gap-5">
        <Feature icon={Lock} label="Lock your card" />
        <Feature icon={Share2} label="Share the graphic" />
        <Feature icon={Trophy} label="Climb the board" />
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-ink-850/60 p-3.5 lg:p-6">
      <Icon className="h-5 w-5 text-lime lg:h-7 lg:w-7" />
      <div className="mt-2.5 text-[12px] font-bold leading-tight lg:mt-4 lg:text-base">
        {label}
      </div>
    </div>
  );
}
