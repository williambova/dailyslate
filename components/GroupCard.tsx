"use client";

import { useState } from "react";
import { Copy, Check, Users } from "lucide-react";
import type { Group } from "@/types";
import { CURRENT_USER } from "@/data/mockUsers";
import { cn } from "@/lib/cn";

/**
 * A single friend group: name, members, a copyable invite code, and a mini
 * standings table. Standings use each member's overall win% as a stand-in;
 * later this is a per-group aggregate computed from the `picks` table.
 */
export function GroupCard({ group }: { group: Group }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const standings = [...group.members].sort(
    (a, b) => b.overallWinPercentage - a.overallWinPercentage
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-ink-850/60">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-extrabold tracking-tight">
            {group.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-ink-600">
            <Users className="h-3.5 w-3.5" />
            {group.members.length} members
          </div>
        </div>

        <button
          onClick={copyCode}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition active:scale-95",
            copied
              ? "border-lime/50 bg-lime/15 text-lime"
              : "border-line bg-ink-800 text-white/80"
          )}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span className="tnum">{copied ? "Copied" : group.inviteCode}</span>
        </button>
      </div>

      {/* Avatars */}
      <div className="flex items-center gap-1.5 px-4 pb-3">
        {group.members.slice(0, 6).map((m) => (
          <span
            key={m.id}
            title={m.name}
            className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-ink-700 to-ink-600 text-[10px] font-extrabold text-white/90 ring-2 ring-ink-850"
          >
            {m.avatar}
          </span>
        ))}
      </div>

      {/* Mini standings */}
      <div className="border-t border-line bg-ink-900/40">
        {standings.map((m, i) => {
          const isMe = m.id === CURRENT_USER.id;
          return (
            <div
              key={m.id}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5",
                i !== standings.length - 1 && "border-b border-line/60",
                isMe && "bg-lime/[0.06]"
              )}
            >
              <span className="tnum w-4 text-center text-xs font-extrabold text-ink-600">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {m.name}
                {isMe && (
                  <span className="ml-1.5 rounded bg-lime/20 px-1.5 py-px text-[9px] font-bold uppercase text-lime">
                    You
                  </span>
                )}
              </span>
              <span className="tnum text-sm font-extrabold">
                {m.overallWinPercentage}
                <span className="text-[11px] text-ink-600">%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
