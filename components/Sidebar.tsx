"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardCheck,
  Trophy,
  Users,
  User as UserIcon,
  Flame,
} from "lucide-react";
import { Wordmark } from "./Wordmark";
import { useSlate } from "@/lib/store";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/slate", label: "Today's Slate", icon: CalendarDays },
  { href: "/my-picks", label: "My Picks", icon: ClipboardCheck },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/profile", label: "Profile", icon: UserIcon },
] as const;

/**
 * Desktop-only sidebar. On mobile the app uses the top Header + BottomNav
 * instead; this is hidden below `lg`. Carries branding, primary nav, and the
 * user chip so desktop reads as a real app rather than a stretched phone.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useSlate();

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col justify-between px-4 py-6 lg:flex">
      <div>
        <Link href="/" aria-label="Daily Slate home" className="block px-2">
          <Wordmark size="lg" />
        </Link>

        <nav className="mt-8 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/slate" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-bold transition-colors",
                  active
                    ? "bg-lime/[0.10] text-lime"
                    : "text-ink-600 hover:bg-ink-850 hover:text-white/90"
                )}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.4 : 2}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User chip */}
      <Link
        href="/profile"
        className="flex items-center gap-3 rounded-2xl border border-line bg-ink-850/60 p-3 transition-colors hover:border-white/15"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-lime to-electric text-[13px] font-extrabold text-ink-950">
          {user.avatar}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-bold">{user.name}</div>
          <div className="truncate text-[12px] font-medium text-ink-600">
            @{user.username}
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-line bg-ink-900 px-2 py-1 text-[11px] font-bold tnum">
          <Flame className="h-3.5 w-3.5 text-lime" />
          {user.currentStreak}
        </span>
      </Link>
    </aside>
  );
}
