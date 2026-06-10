"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, Flame, RefreshCw, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSlate } from "@/lib/store";
import { listMyGroups, type GroupMember } from "@/lib/groups";
import {
  computeStandings,
  ensureGraded,
  fetchPicksRange,
  fetchResultsRange,
  recentSlateKeys,
  type StandingRow,
} from "@/lib/history";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/cn";

/**
 * Leaderboard (#7) — real standings across everyone you compete with (the
 * members of all your groups), graded against stored results. Past days come
 * from the `results` table (backfilled on demand via /api/grade); today is
 * graded live against the current slate.
 */
type Scope = "today" | "week" | "all";
const SCOPE_DAYS: Record<Scope, number> = { today: 1, week: 7, all: 30 };

const TABS: { key: Scope; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "all", label: "All-Time" },
];

interface Row extends StandingRow {
  member: GroupMember;
}

export default function LeaderboardPage() {
  const { isAuthed, isConfigured, authUserId, status, user } = useAuth();
  const { games, slateKey } = useSlate();

  const [scope, setScope] = useState<Scope>("today");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Everyone I compete with = union of members across my groups.
  useEffect(() => {
    if (status === "loading") return;
    if (!isAuthed || !authUserId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const groups = await listMyGroups(authUserId);
        const map = new Map<string, GroupMember>();
        for (const g of groups) for (const m of g.members) map.set(m.id, m);
        setMembers(Array.from(map.values()));
      } catch (e: any) {
        setError(e?.message ?? "Couldn't load groups.");
        setLoading(false);
      }
    })();
  }, [status, isAuthed, authUserId]);

  const compute = useCallback(async () => {
    if (members.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const dates = recentSlateKeys(SCOPE_DAYS[scope]);
      const ids = members.map((m) => m.id);

      let [picks, results] = await Promise.all([
        fetchPicksRange(ids, dates),
        fetchResultsRange(dates),
      ]);

      // Backfill grading for past days that have picks but no results yet.
      const today = slateKey || recentSlateKeys(1)[0];
      if (await ensureGraded(picks, results, today)) {
        results = await fetchResultsRange(dates);
      }

      const standings = computeStandings(picks, results, today, games);
      const next: Row[] = members
        .map((m) => ({
          member: m,
          ...(standings.get(m.id) ?? {
            userId: m.id,
            locked: 0,
            correct: 0,
            completed: 0,
            winPct: null as number | null,
          }),
        }))
        .sort(
          (a, b) =>
            (b.winPct ?? -1) - (a.winPct ?? -1) ||
            b.correct - a.correct ||
            b.locked - a.locked
        );
      setRows(next);
    } catch (e: any) {
      setError(e?.message ?? "Couldn't compute standings.");
    } finally {
      setLoading(false);
    }
  }, [members, scope, slateKey, games]);

  useEffect(() => {
    compute();
  }, [compute]);

  const subtitle = useMemo(
    () =>
      scope === "today"
        ? "Graded live as today's games finish."
        : scope === "week"
          ? "Last 7 days, graded against final results."
          : "Last 30 days, graded against final results.",
    [scope]
  );

  if (!isAuthed && status !== "loading") {
    return (
      <div className="px-4 pb-4 pt-4 lg:mx-auto lg:max-w-[640px]">
        <h1 className="text-2xl font-extrabold tracking-tight">Leaderboard</h1>
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-ink-850/40 p-10 text-center">
          <Trophy className="mx-auto h-8 w-8 text-ink-600" />
          <p className="mt-3 text-sm font-semibold">Sign in to compete.</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
            Standings track everyone in your groups across days — that needs an
            account.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-ink-950"
          >
            <LogIn className="h-4 w-4" />
            {isConfigured ? "Create account / Log in" : "Set up accounts"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-4 lg:mx-auto lg:max-w-[640px]">
      <h1 className="text-2xl font-extrabold tracking-tight">Leaderboard</h1>
      <p className="mt-1 text-[13px] font-medium text-ink-600">{subtitle}</p>

      {/* Scope tabs */}
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-ink-850/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setScope(t.key)}
            className={cn(
              "rounded-xl py-2 text-[13px] font-bold transition",
              scope === t.key
                ? "bg-lime text-ink-950"
                : "text-ink-600 hover:text-white/80"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-[13px] font-semibold text-red-400">{error}</p>
      )}

      {loading ? (
        <div className="mt-4 space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border border-line bg-ink-850/50"
            />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-ink-850/40 p-10 text-center">
          <Trophy className="mx-auto h-8 w-8 text-ink-600" />
          <p className="mt-3 text-sm font-semibold">No competition yet.</p>
          <p className="mt-1 text-[13px] text-ink-600">
            Create a group and invite friends — standings build from everyone&apos;s
            locked picks.
          </p>
          <Link
            href="/groups"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-ink-950"
          >
            Go to groups
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-2.5">
            {rows.map((r, i) => {
              const isMe = r.member.id === user.id;
              return (
                <div
                  key={r.member.id}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3.5",
                    isMe
                      ? "border-lime/40 bg-lime/[0.06]"
                      : "border-line bg-ink-850/60"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-extrabold tnum",
                      i === 0
                        ? "bg-lime text-ink-950"
                        : i === 1
                          ? "bg-white/20 text-white"
                          : i === 2
                            ? "bg-amber-500/60 text-ink-950"
                            : "bg-ink-800 text-ink-600"
                    )}
                  >
                    {i + 1}
                  </span>
                  <Avatar
                    name={r.member.name}
                    initials={r.member.avatar}
                    url={r.member.avatarUrl}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">
                      {r.member.name}
                      {isMe && (
                        <span className="ml-1.5 rounded bg-lime/20 px-1.5 py-px text-[9px] font-bold uppercase text-lime">
                          You
                        </span>
                      )}
                    </div>
                    <div className="tnum text-[12px] font-semibold text-ink-600">
                      {r.locked === 0
                        ? "no picks"
                        : `${r.correct}/${r.completed} correct · ${r.locked} locked`}
                    </div>
                  </div>
                  <span className="tnum text-xl font-extrabold">
                    {r.winPct === null ? (
                      <span className="text-ink-600">—</span>
                    ) : (
                      <>
                        {r.winPct}
                        <span className="text-sm text-ink-600">%</span>
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={compute}
            className="mx-auto mt-4 flex items-center gap-1.5 rounded-xl border border-line bg-ink-850 px-3.5 py-2 text-[12px] font-bold text-ink-600"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </>
      )}
    </div>
  );
}
