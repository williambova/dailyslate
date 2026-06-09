"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardCheck,
  Trophy,
  Users,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/slate", label: "Slate", icon: CalendarDays },
  { href: "/my-picks", label: "Picks", icon: ClipboardCheck },
  { href: "/leaderboard", label: "Board", icon: Trophy },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 border-t border-line bg-ink-950/85 backdrop-blur-xl">
      <div className="grid grid-cols-5 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/slate" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                active ? "text-lime" : "text-ink-600 hover:text-white/70"
              )}
            >
              <Icon
                className={cn("h-[22px] w-[22px]", active && "drop-shadow-[0_0_8px_rgba(198,242,78,0.5)]")}
                strokeWidth={active ? 2.4 : 2}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
