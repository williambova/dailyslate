import {
  Crown,
  Flame,
  Sparkles,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { BadgeKey } from "@/lib/scoring";
import { cn } from "@/lib/cn";

const BADGE_STYLE: Record<
  BadgeKey,
  { icon: LucideIcon; color: string; ring: string }
> = {
  ranTheSlate: { icon: Crown, color: "#C6F24E", ring: "rgba(198,242,78,0.4)" },
  perfect: { icon: Sparkles, color: "#C6F24E", ring: "rgba(198,242,78,0.35)" },
  streak: { icon: Flame, color: "#FF7A1A", ring: "rgba(255,122,26,0.35)" },
  underdog: { icon: Target, color: "#A875FF", ring: "rgba(168,117,255,0.35)" },
  groupWinner: { icon: Crown, color: "#FFC83D", ring: "rgba(255,200,61,0.35)" },
};

export function Badge({
  badgeKey,
  label,
  className,
}: {
  badgeKey: BadgeKey;
  label: string;
  className?: string;
}) {
  const s = BADGE_STYLE[badgeKey];
  const Icon = s.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        className
      )}
      style={{
        color: s.color,
        borderColor: s.ring,
        background: `${s.color}14`,
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

/** Lightweight neutral pill used for statuses + counts. */
export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "lime" | "live" | "muted";
  className?: string;
}) {
  const tones = {
    neutral: "border-line bg-ink-850 text-white/80",
    lime: "border-lime/40 bg-lime/10 text-lime",
    live: "border-red-500/40 bg-red-500/10 text-red-400",
    muted: "border-line bg-transparent text-ink-600",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        tones,
        className
      )}
    >
      {children}
    </span>
  );
}

export { Zap };
