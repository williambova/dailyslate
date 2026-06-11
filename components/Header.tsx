"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { Wordmark } from "./Wordmark";
import { Avatar } from "./Avatar";
import { useSlate } from "@/lib/store";

export function Header() {
  const { user } = useSlate();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink-950/80 backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" aria-label="Daily Slate home">
          <Wordmark size="md" />
        </Link>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full border border-line bg-ink-850 px-2.5 py-1 text-xs font-semibold tnum">
            <Flame className="h-3.5 w-3.5 text-lime" />
            {user.currentStreak}
          </span>
          <Link href="/profile" aria-label="Profile">
            <Avatar
              name={user.name}
              initials={user.avatar}
              url={user.avatarUrl}
              size={32}
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
