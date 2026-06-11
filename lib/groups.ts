import { supabase } from "@/lib/supabase";

/**
 * Real groups (Supabase). All functions assume a signed-in user — the Groups
 * screen gates on auth before calling these.
 */

export interface GroupMember {
  id: string;
  name: string;
  username: string;
  avatar: string;
  avatarUrl?: string | null;
}

export interface RealGroup {
  id: string;
  name: string;
  inviteCode: string;
  members: GroupMember[];
}

export interface MemberPickRow {
  user_id: string;
  game_id: string;
  selected_team: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function newInviteCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `SLATE-${s}`;
}

/** All groups the signed-in user belongs to, with member profiles. */
export async function listMyGroups(userId: string): Promise<RealGroup[]> {
  if (!supabase) return [];

  const { data: mine, error: e1 } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);
  if (e1) throw new Error(e1.message);
  const groupIds = (mine ?? []).map((r) => r.group_id);
  if (groupIds.length === 0) return [];

  const [{ data: groups, error: e2 }, { data: members, error: e3 }] =
    await Promise.all([
      supabase.from("groups").select("id, name, invite_code").in("id", groupIds),
      supabase.from("group_members").select("group_id, user_id").in("group_id", groupIds),
    ]);
  if (e2) throw new Error(e2.message);
  if (e3) throw new Error(e3.message);

  const memberIds = Array.from(new Set((members ?? []).map((m) => m.user_id)));
  const { data: profiles, error: e4 } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", memberIds);
  if (e4) throw new Error(e4.message);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        id: p.id,
        name: p.display_name || p.username || "Player",
        username: p.username || "player",
        avatar: initials(p.display_name || p.username || "??"),
        avatarUrl: p.avatar_url ?? null,
      } satisfies GroupMember,
    ])
  );

  return (groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    inviteCode: g.invite_code,
    members: (members ?? [])
      .filter((m) => m.group_id === g.id)
      .map(
        (m) =>
          profileMap.get(m.user_id) ?? {
            id: m.user_id,
            name: "Player",
            username: "player",
            avatar: "??",
          }
      ),
  }));
}

/** Create a group (retries once if the random code collides). */
export async function createGroup(name: string, ownerId: string): Promise<RealGroup> {
  if (!supabase) throw new Error("Accounts aren't configured.");

  for (let attempt = 0; attempt < 2; attempt++) {
    const code = newInviteCode();
    const { data, error } = await supabase
      .from("groups")
      .insert({ name: name.trim(), invite_code: code, owner_id: ownerId })
      .select("id, name, invite_code")
      .single();

    if (error) {
      if (error.code === "23505" && attempt === 0) continue; // code collision
      throw new Error(error.message);
    }

    const { error: mErr } = await supabase
      .from("group_members")
      .insert({ group_id: data.id, user_id: ownerId });
    if (mErr) throw new Error(mErr.message);

    return { id: data.id, name: data.name, inviteCode: data.invite_code, members: [] };
  }
  throw new Error("Couldn't generate an invite code, try again.");
}

/** Join a group via invite code (server-side RPC handles lookup + insert). */
export async function joinGroup(code: string): Promise<{ id: string; name: string }> {
  if (!supabase) throw new Error("Accounts aren't configured.");
  const { data, error } = await supabase.rpc("join_group_by_code", { code });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("No group found for that code.");
  return { id: row.id, name: row.name };
}

/** Locked picks for a set of members on a given slate (for standings). */
export async function fetchMemberPicks(
  memberIds: string[],
  slateDate: string
): Promise<MemberPickRow[]> {
  if (!supabase || memberIds.length === 0) return [];
  const { data, error } = await supabase
    .from("picks")
    .select("user_id, game_id, selected_team")
    .in("user_id", memberIds)
    .eq("slate_date", slateDate)
    .eq("is_locked", true);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Shareable invite link for a group (works on any host, incl. dailyslate.io). */
export function inviteLink(code: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://dailyslate.io";
  return `${origin}/join/${encodeURIComponent(code)}`;
}
