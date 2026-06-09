"use client";

import { useState } from "react";
import { Plus, UserPlus, X } from "lucide-react";
import type { Group } from "@/types";
import { mockGroups, newInviteCode } from "@/data/mockGroups";
import { CURRENT_USER } from "@/data/mockUsers";
import { GroupCard } from "@/components/GroupCard";
import { cn } from "@/lib/cn";

/**
 * Friends / Groups (#6). Local state only for the MVP — create spins up a new
 * group with a fresh invite code; join looks the code up against known groups.
 * Later: Supabase `groups` + `group_members` with server-side invite codes.
 */
type Mode = "none" | "create" | "join";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [mode, setMode] = useState<Mode>("none");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const createGroup = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const group: Group = {
      id: `grp_${Date.now()}`,
      name: trimmed,
      inviteCode: newInviteCode(),
      members: [CURRENT_USER],
    };
    setGroups((g) => [group, ...g]);
    setName("");
    setMode("none");
  };

  const joinGroup = () => {
    const target = code.trim().toUpperCase();
    setError("");
    if (!target) return;
    if (groups.some((g) => g.inviteCode.toUpperCase() === target)) {
      setError("You're already in that group.");
      return;
    }
    const known = mockGroups.find((g) => g.inviteCode.toUpperCase() === target);
    if (!known) {
      setError("No group found for that code.");
      return;
    }
    setGroups((g) => [known, ...g]);
    setCode("");
    setMode("none");
  };

  return (
    <div className="px-4 pb-4 pt-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Groups</h1>
      <p className="mt-1 text-[13px] font-medium text-ink-600">
        Run the slate against your friends.
      </p>

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

      {/* Create / Join panels */}
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
            onKeyDown={(e) => e.key === "Enter" && joinGroup()}
            placeholder="SLATE-XXXX"
            className="w-full rounded-xl border border-line bg-ink-900 px-3.5 py-3 text-sm font-bold uppercase tracking-wide text-white outline-none placeholder:text-ink-600 focus:border-electric/50"
          />
          {error && (
            <p className="mt-2 text-[12px] font-semibold text-red-400">
              {error}
            </p>
          )}
          <button
            onClick={joinGroup}
            disabled={!code.trim()}
            className="mt-2.5 w-full rounded-xl bg-electric py-3 text-sm font-extrabold uppercase tracking-wide text-white transition active:scale-95 disabled:opacity-50"
          >
            Join group
          </button>
          <p className="mt-2.5 text-[11px] text-ink-600">
            Try <span className="font-bold text-white/80">SLATE-QX91</span> to
            join the Golf Trip Crew.
          </p>
        </Panel>
      )}

      {/* Group list */}
      <div className="mt-5 space-y-4">
        {groups.map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
      </div>
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
