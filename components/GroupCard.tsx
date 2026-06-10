"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, Users, Lock, Share2, MessageCircle, ChevronRight } from "lucide-react";
import { useSlate } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { fetchMemberPicks, inviteLink, type RealGroup } from "@/lib/groups";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/cn";

/**
 * A real group: members, copyable invite code, and TODAY's standings —
 * each member's locked picks graded against today's actual final results.
 * Rank: win% on completed games, then total correct, then most picks locked.
 */
interface Standing {
  member: RealGroup["members"][number];
  locked: number;
  correct: number;
  completed: number;
  winPct: number | null;
}

export function GroupCard({ group }: { group: RealGroup }) {
  const { games, slateKey } = useSlate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [standings, setStandings] = useState<Standing[]>(
    group.members.map((m) => ({
      member: m,
      locked: 0,
      correct: 0,
      completed: 0,
      winPct: null,
    }))
  );

  // Grade members' locked picks against today's finals.
  useEffect(() => {
    if (!slateKey || group.members.length === 0) return;
    let active = true;

    (async () => {
      try {
        const rows = await fetchMemberPicks(
          group.members.map((m) => m.id),
          slateKey
        );
        if (!active) return;

        const finals = new Map(
          games
            .filter((g) => g.status === "final" && g.winner)
            .map((g) => [g.id, g.winner as string])
        );

        const byUser = new Map<string, { locked: number; correct: number; completed: number }>();
        for (const r of rows) {
          const s = byUser.get(r.user_id) ?? { locked: 0, correct: 0, completed: 0 };
          s.locked += 1;
          const winner = finals.get(r.game_id);
          if (winner) {
            s.completed += 1;
            if (winner === r.selected_team) s.correct += 1;
          }
          byUser.set(r.user_id, s);
        }

        const next: Standing[] = group.members.map((m) => {
          const s = byUser.get(m.id) ?? { locked: 0, correct: 0, completed: 0 };
          return {
            member: m,
            ...s,
            winPct: s.completed > 0 ? Math.round((s.correct / s.completed) * 100) : null,
          };
        });
        next.sort(
          (a, b) =>
            (b.winPct ?? -1) - (a.winPct ?? -1) ||
            b.correct - a.correct ||
            b.locked - a.locked
        );
        setStandings(next);
      } catch {
        /* keep whatever we have */
      }
    })();

    return () => {
      active = false;
    };
  }, [group.members, slateKey, games]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  // Share a one-tap invite link (native share sheet, clipboard fallback).
  const [linkCopied, setLinkCopied] = useState(false);
  const shareLink = async () => {
    const url = inviteLink(group.inviteCode);
    const payload = {
      title: "Join my Daily Slate group",
      text: `Join "${group.name}" on Daily Slate — pick today's games and let's see who's got the best win %.`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch {
      /* user cancelled or share failed; fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-ink-850/60">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <Link href={`/groups/${group.id}`} className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1 truncate text-lg font-extrabold tracking-tight">
            {group.name}
            <ChevronRight className="h-4.5 w-4.5 shrink-0 text-ink-600" />
          </h3>
          <div className="mt-1 flex items-center gap-2.5 text-[12px] font-semibold text-ink-600">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {group.members.length} member{group.members.length === 1 ? "" : "s"}
            </span>
            <span className="flex items-center gap-1 text-lime">
              <MessageCircle className="h-3.5 w-3.5" />
              Chat
            </span>
          </div>
        </Link>

        <button
          onClick={copyCode}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition active:scale-95",
            copied
              ? "border-lime/50 bg-lime/15 text-lime"
              : "border-line bg-ink-800 text-white/80"
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="tnum">{copied ? "Copied" : group.inviteCode}</span>
        </button>
      </div>

      {/* Avatars + invite */}
      <div className="flex items-center justify-between px-4 pb-3">
        <div className="flex items-center gap-1.5">
          {group.members.slice(0, 6).map((m) => (
            <Avatar
              key={m.id}
              name={m.name}
              initials={m.avatar}
              url={m.avatarUrl}
              size={32}
              className="ring-2 ring-ink-850"
            />
          ))}
          {group.members.length > 6 && (
            <span className="text-[11px] font-bold text-ink-600">
              +{group.members.length - 6}
            </span>
          )}
        </div>
        <button
          onClick={shareLink}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-lime px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-950 transition active:scale-95"
        >
          {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          {linkCopied ? "Link copied" : "Invite"}
        </button>
      </div>

      {/* Today's standings */}
      <div className="border-t border-line bg-ink-900/40">
        <div className="flex items-center justify-between px-4 pb-1 pt-2.5 text-[10px] font-extrabold uppercase tracking-wide text-ink-600">
          <span>Today</span>
          <span>Win %</span>
        </div>
        {standings.map((s, i) => {
          const isMe = s.member.id === user.id;
          return (
            <div
              key={s.member.id}
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
                {s.member.name}
                {isMe && (
                  <span className="ml-1.5 rounded bg-lime/20 px-1.5 py-px text-[9px] font-bold uppercase text-lime">
                    You
                  </span>
                )}
              </span>
              <span className="tnum flex items-center gap-1 text-[11px] font-semibold text-ink-600">
                {s.locked > 0 ? (
                  <>
                    <Lock className="h-3 w-3" /> {s.correct}/{s.completed}
                  </>
                ) : (
                  "no card"
                )}
              </span>
              <span className="tnum w-12 text-right text-sm font-extrabold">
                {s.winPct === null ? (
                  <span className="text-ink-600">—</span>
                ) : (
                  <>
                    {s.winPct}
                    <span className="text-[11px] text-ink-600">%</span>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
