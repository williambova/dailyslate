"use client";

import { useEffect, useState } from "react";
import { Plus, UserPlus, X, Users } from "lucide-react";
import type { Group } from "@/types";
import { useSlate } from "@/lib/store";
import { GroupCard } from "@/components/GroupCard";
import { cn } from "@/lib/cn";

/**
 * Friends / Groups (#6). No mock groups — you start empty and create your own.
 * Created groups persist locally (localStorage). Inviting friends across
 * devices needs a backend (Supabase), so Join is informational for now.
 */
type Mode = "none" | "create" | "join";
const GROUPS_KEY = "dailyslate:groups";

function newInviteCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `SLATE-${s}`;
}

export default function GroupsPage() {
  const { user } = useSlate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [mode, setMode] = useState<Mode>("none");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Load any locally-created groups.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GROUPS_KEY);
      if (raw) setGroups(JSON.parse(raw) as Group[]);
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  const persist = (next: Group[]) => {
    setGroups(next);
    try {
      localStorage.setItem(GROUPS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const createGroup = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const group: Group = {
      id: `grp_${Date.now()}`,
      name: trimmed,
      inviteCode: newInviteCode(),
      members: [user],
    };
    persist([group, ...groups]);
    setName("");
    setMode("none");
  };

  return (
    <div className="px-4 pb-4 pt-4 lg:mx-auto lg:max-w-[880px]">
      <h1 className="text-2xl font-extrabold tracking-tight">Groups</h1>
      <p className="mt-1 text-[13px] font-medium text-ink-600">
        Run the slate against your friends.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setMode(mode === "create" ? "none" : "create")}
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
          onClick={() => setMode(mode === "join" ? "none" : "join")}
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
            onKeyDown={(e) => e.key === "Enter" && createGroup()}
            placeholder="Group name"
            className="w-full rounded-xl border border-line bg-ink-900 px-3.5 py-3 text-sm font-medium text-white outline-none placeholder:text-ink-600 focus:border-lime/50"
          />
          <button
            onClick={createGroup}
            disabled={!name.trim()}
            className="mt-2.5 w-full rounded-xl bg-lime py-3 text-sm font-extrabold uppercase tracking-wide text-ink-950 transition active:scale-95 disabled:opacity-50"
          >
            Create group
          </button>
        </Panel>
      )}

      {mode === "join" && (
        <Panel onClose={() => setMode("none")} title="Join with invite code">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="SLATE-XXXX"
            className="w-full rounded-xl border border-line bg-ink-900 px-3.5 py-3 text-sm font-bold uppercase tracking-wide text-white outline-none placeholder:text-ink-600 focus:border-electric/50"
          />
          <p className="mt-2.5 text-[12px] leading-relaxed text-ink-600">
            Joining a friend&apos;s group syncs members across devices, which
            needs an account. Accounts are coming soon — for now you can create
            your own group above.
          </p>
        </Panel>
      )}

      {/* List or empty state */}
      {loaded && groups.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-ink-850/40 p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-ink-600" />
          <p className="mt-3 text-sm font-semibold">No groups yet.</p>
          <p className="mt-1 text-[13px] text-ink-600">
            Create a group to start a private leaderboard with your friends.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
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
