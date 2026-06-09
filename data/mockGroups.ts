import type { Group } from "@/types";
import { mockUsers } from "./mockUsers";

/**
 * MOCK DATA — friend groups. Local state only in the MVP.
 * Later: Supabase tables `groups` + `group_members`, with invite_code
 * generated server-side and joinable via a lookup.
 */
export const mockGroups: Group[] = [
  {
    id: "grp_chat",
    name: "The Group Chat",
    inviteCode: "SLATE-7F2K",
    members: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3]],
  },
  {
    id: "grp_golf",
    name: "Golf Trip Crew",
    inviteCode: "SLATE-QX91",
    members: [mockUsers[0], mockUsers[4], mockUsers[5]],
  },
];

export function newInviteCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `SLATE-${s}`;
}
