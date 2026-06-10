"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, UserPlus, X, Users, LogIn, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  createGroup,
  joinGroup,
  listMyGroups,
  type RealGroup,
} from "@/lib/groups";
import { GroupCard } from "@/components/GroupCard";
import { cn } from "@/lib/cn";

/**
 * Friends / Groups (#6) — real multiplayer. Signed-in users create groups and
 * share the invite code; friends sign up and join with it. Standings on each
 * card grade locked picks against today's actual results.
 */
type Mode = "none" | "create" | "join";

export default function GroupsPage() {
  const { isAuthed, isConfigured, authUserId, status } = useAuth();

  const [groups, setGroups] = useState<RealGroup[]>([]);
  const [mode, setMode] = useState<Mode>("none");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthed || !authUserId) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setGroups(await listMyGroups(authUserId));
    } catch (e: any) {
      setError(e?.message ?? "Couldn't load groups.");
    } finally {
      setLoading(false);
    }
  }, [isAuthed, authUserId]);

  useEffect(() => {
    if (status !== "loading") refresh();
  }, [status, refresh]);

  const onCreate = async () => {
    if (!name.trim() || !authUserId) return;
    setBusy(true);
    setError("");
    try {
      await createGroup(name, authUserId);
      setName("");
      setMode("none");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Couldn't create the group.");
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    try {
      await joinGroup(code);
      setCode("");
      setMode("none");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Couldn't join with that code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 pb-4 pt-4 lg:mx-auto lg:max-w-[880px]">
      <h1 className="text-2xl font-extrabold tracking-tight">Groups</h1>
      <p className="mt-1 text-[13px] font-medium text-ink-600">
        Run the slate against your friends.
      </p>

      {/* Signed out → groups need an account */}
      {!isAuthed ? (
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-ink-850/40 p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-ink-600" />
          <p className="mt-3 text-sm font-semibold">Groups need an account.</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
            Create a free account so your group and picks sync across devices —
            then invite your friends with a code.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-ink-950"
          >
            <LogIn className="h-4 w-4" />
            {isConfigured ? "Create account / Log in" : "Set up accounts"}
          </Link>
        </div>
      ) : (
        <>
          {/* Actions */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                setMode(mode === "create" ? "none" : "create");
                setError("");
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-2xl border py-3.5 text-sm font-bold transition active:scale-95",
                mode === "create"
                  ? "border-lime/50 bg-lime/15 text-lime"
                  : "border-line bg-ink-850 text-white/85"
              )}
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Create
            </button>
            <button
              onClick={() => {
                setMode(mode === "join" ? "none" : "join");
                setError("");
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-2xl border py-3.5 text-sm font-bold transition active:scale-95",
                mode === "join"
                  ? "border-electric/50 bg-electric/15 text-electric"
                  : "border-line bg-ink-850 text-white/85"
              )}
            >
              <UserPlus className="h-4 w-4" strokeWidth={2.5} />
              Join
            </button>
          </div>

          {mode === "create" && (
            <Panel onClose={() => setMode("none")} title="New group">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onCreate()}
                placeholder="Group name"
                className="w-full rounded-xl border border-line bg-ink-900 px-3.5 py-3 text-sm font-medium text-white outline-none placeholder:text-ink-600 focus:border-lime/50"
              />
              <button
                onClick={onCreate}
                disabled={!name.trim() || busy}
                className="mt-2.5 w-full rounded-xl bg-lime py-3 text-sm font-extrabold uppercase tracking-wide text-ink-950 transition active:scale-95 disabled:opacity-50"
              >
                {busy ? "Creating…" : "Create group"}
              </button>
            </Panel>
          )}

          {mode === "join" && (
            <Panel onClose={() => setMode("none")} title="Join with invite code">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onJoin()}
                placeholder="SLATE-XXXX"
                className="w-full rounded-xl border border-line bg-ink-900 px-3.5 py-3 text-sm font-bold uppercase tracking-wide text-white outline-none placeholder:text-ink-600 focus:border-electric/50"
              />
              <button
                onClick={onJoin}
                disabled={!code.trim() || busy}
                className="mt-2.5 w-full rounded-xl bg-electric py-3 text-sm font-extrabold uppercase tracking-wide text-white transition active:scale-95 disabled:opacity-50"
              >
                {busy ? "Joining…" : "Join group"}
              </button>
            </Panel>
          )}

          {error && (
            <p className="mt-3 text-[13px] font-semibold text-red-400">{error}</p>
          )}

          {/* Group list */}
          {loading ? (
            <div className="mt-5 h-40 animate-pulse rounded-3xl border border-line bg-ink-850/50" />
          ) : groups.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-line bg-ink-850/40 p-10 text-center">
              <Users className="mx-auto h-8 w-8 text-ink-600" />
              <p className="mt-3 text-sm font-semibold">No groups yet.</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
                Create one and send your friends the invite code. They sign up,
                tap Join, enter the code — and the daily competition is on.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5 space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {groups.map((g) => (
                  <GroupCard key={g.id} group={g} />
                ))}
              </div>
              <button
                onClick={refresh}
                className="mx-auto mt-4 flex items-center gap-1.5 rounded-xl border border-line bg-ink-850 px-3.5 py-2 text-[12px] font-bold text-ink-600"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh standings
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Panel({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="mt-2.5 animate-fade-up rounded-2xl border border-line bg-ink-850/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wide text-ink-600">
          {title}
        </span>
        <button onClick={onClose} aria-label="Close">
          <X className="h-4 w-4 text-ink-600" />
        </button>
      </div>
      {children}
    </div>
  );
}
