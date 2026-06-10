import { supabase } from "@/lib/supabase";

/**
 * Ephemeral group chat. Messages older than WINDOW_HOURS are purged
 * server-side (RPC on every chat open + nightly cron) and are never displayed
 * even if a purge hasn't run yet. Nothing is archived.
 */

export const WINDOW_HOURS = 6;

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

function rowToMessage(r: any): ChatMessage {
  return {
    id: r.id,
    groupId: r.group_id,
    senderId: r.sender_id,
    body: r.body,
    createdAt: r.created_at,
  };
}

/** Delete expired messages app-wide (cheap, idempotent). */
export async function purgeOldMessages(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.rpc("purge_old_messages");
  } catch {
    /* non-fatal */
  }
}

/** Messages within the visibility window, oldest first. */
export async function fetchMessages(groupId: string): Promise<ChatMessage[]> {
  if (!supabase) return [];
  const cutoff = new Date(Date.now() - WINDOW_HOURS * 3600_000).toISOString();
  const { data, error } = await supabase
    .from("group_messages")
    .select("id, group_id, sender_id, body, created_at")
    .eq("group_id", groupId)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToMessage);
}

export async function sendMessage(
  groupId: string,
  senderId: string,
  body: string
): Promise<void> {
  if (!supabase) throw new Error("Chat isn't configured.");
  const trimmed = body.trim().slice(0, 500);
  if (!trimmed) return;
  const { error } = await supabase
    .from("group_messages")
    .insert({ group_id: groupId, sender_id: senderId, body: trimmed });
  if (error) throw new Error(error.message);
}

/**
 * Live-subscribe to new messages in a group. Returns an unsubscribe fn.
 * RLS still applies — only members receive events.
 */
export function subscribeToMessages(
  groupId: string,
  onMessage: (m: ChatMessage) => void
): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`group-chat-${groupId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "group_messages",
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => onMessage(rowToMessage(payload.new))
    )
    .subscribe();
  return () => {
    supabase?.removeChannel(channel);
  };
}
