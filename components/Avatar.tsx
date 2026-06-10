"use client";

import { cn } from "@/lib/cn";

/**
 * Single avatar component used everywhere (header, sidebar, profile, groups,
 * leaderboard). Shows the uploaded image when present, otherwise gradient
 * initials. Update rendering here once and it changes app-wide.
 */
export function Avatar({
  name,
  initials,
  url,
  size = 36,
  square = false,
  className,
}: {
  name?: string;
  initials: string;
  url?: string | null;
  size?: number;
  square?: boolean;
  className?: string;
}) {
  const radius = square ? "rounded-2xl" : "rounded-full";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? initials}
        width={size}
        height={size}
        className={cn(radius, "shrink-0 object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn(
        radius,
        "grid shrink-0 place-items-center bg-gradient-to-br from-lime to-electric font-extrabold text-ink-950",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.32) }}
      title={name}
    >
      {initials}
    </span>
  );
}
