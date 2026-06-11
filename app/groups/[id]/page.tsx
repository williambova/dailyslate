"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Share2, Check, Timer } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { listMyGroups, inviteLink, type RealGroup } from "@/lib/groups";
import {
  fetchMessages,
  purgeOldMessages,
  sendMessage,
  subscribeToMessages,
  WINDOW_HOURS,
  type ChatMessage,
} from "@/lib/chat";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/cn";

/**
 * Group room (#groups/[id]) — members + a live, EPHEMERAL chat. Messages are
 * visible to group members only and disappear after WINDOW_HOURS; expired
 * rows are purged on open and nightly. Nothing is archived.
 */
export default function GroupPage({ params }: { params: { id: string } }) {
  const groupId = params.id;
  const { isAuthed, authUserId, status, user } = useAuth();

  const [group, setGroup] = useState<RealGroup | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load the group (must be a member to see it at all).
  useEffect(() => {
    if (status === "loading" || !isAuthed || !authUserId) return;
    (async () => {
      try {
        const groups = await listMyGroups(authUserId);
        const g = groups.find((x) => x.id === groupId) ?? null;
        setGroup(g);
        setNotFound(!g);
      } catch {
        setNotFound(true);
      }
    })();
  }, [status, isAuthed, authUserId, groupId]);

  // Chat: purge expired, load window, subscribe to live inserts.
  useEffect(() => {
    if (!group) return;
    let unsub = () => {};
    (async () => {
      await purgeOldMessages();
      try {
        setMessages(await fetchMessages(group.id));
      } catch {
        /* leave empty */
      }
      unsub = subscribeToMessages(group.id, (m) =>
        setMessages((prev) =>
          prev.some((x) => x.id === m.id) ? prev : [...prev, m]
        )
      );
    })();
    return () => unsub();
  }, [group]);

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = useCallback(async () => {
    if (!group || !authUserId || !draft.trim() || sending) return;
    setSending(true);
    const body = draft;
    setDraft("");
    try {
      await sendMessage(group.id, authUserId, body);
      // Realtime echoes it back; no optimistic insert needed.
    } catch {
      setDraft(body); // restore on failure
    } finally {
      setSending(false);
    }
  }, [group, authUserId, draft, sending]);

  const shareInvite = async () => {
    if (!group) return;
    const url = inviteLink(group.inviteCode);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join my Daily Slate group",
          text: `Join "${group.name}" on Daily Slate.`,
          url,
        });
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const memberById = new Map((group?.members ?? []).map((m) => [m.id, m]));

  if (status !== "loading" && !isAuthed) {
    return (
      <Shell>
        <p className="mt-6 text-center text-sm text-ink-600">
          Sign in to view this group.
        </p>
      </Shell>
    );
  }

  if (notFound) {
    return (
      <Shell>
        <p className="mt-6 text-center text-sm text-ink-600">
          Group not found — or you&apos;re not a member yet.
        </p>
      </Shell>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col px-4 pt-4 lg:mx-auto lg:h-[calc(100dvh-2rem)] lg:max-w-[640px]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/groups"
          aria-label="Back to groups"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-ink-850"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold tracking-tight">
            {group?.name ?? "…"}
          </h1>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-600">
            <Timer className="h-3 w-3" />
            Messages disappear after {WINDOW_HOURS} hours
          </div>
        </div>
        <button
          onClick={shareInvite}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-lime px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-950 transition active:scale-95"
        >
          {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          {linkCopied ? "Copied" : "Invite"}
        </button>
      </div>

      {/* Members strip */}
      <div className="mt-3 flex items-center gap-1.5">
        {(group?.members ?? []).slice(0, 8).map((m) => (
          <Avatar
            key={m.id}
            name={m.name}
            initials={m.avatar}
            url={m.avatarUrl}
            size={28}
            className="ring-2 ring-ink-950"
          />
        ))}
      </div>

      {/* Messages */}
      <div className="no-scrollbar mt-3 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-line bg-ink-850/40 p-3.5">
        {messages.length === 0 ? (
          <p className="pt-10 text-center text-[13px] text-ink-600">
            Nothing here right now. Talk your talk — it&apos;s gone in{" "}
            {WINDOW_HOURS} hours anyway.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user.id;
            const sender = memberById.get(m.senderId);
            return (
              <div
                key={m.id}
                className={cn("flex items-end gap-2", mine && "flex-row-reverse")}
              >
                <Avatar
                  name={sender?.name ?? "?"}
                  initials={sender?.avatar ?? "?"}
                  url={sender?.avatarUrl}
                  size={26}
                />
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2.5",
                    mine
                      ? "rounded-br-sm bg-lime text-ink-950"
                      : "rounded-bl-sm border border-line bg-ink-800 text-white/90"
                  )}
                >
                  {!mine && (
                    <div className="mb-0.5 text-[10px] font-extrabold uppercase tracking-wide opacity-60">
                      {sender?.name ?? "Member"}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words text-[14px] font-medium leading-snug">
                    {m.body}
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-right text-[9px] font-semibold",
                      mine ? "text-ink-950/60" : "text-ink-600"
                    )}
                  >
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="flex gap-2 py-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Message the group"
          maxLength={500}
          className="min-w-0 flex-1 rounded-2xl border border-line bg-ink-900 px-4 py-3.5 text-sm font-medium text-white outline-none placeholder:text-ink-600 focus:border-lime/50"
        />
        <button
          onClick={send}
          disabled={!draft.trim() || sending}
          aria-label="Send"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lime text-ink-950 transition active:scale-95 disabled:opacity-50"
        >
          <Send className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-4 lg:mx-auto lg:max-w-[640px]">
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-600"
      >
        <ArrowLeft className="h-4 w-4" /> Groups
      </Link>
      {children}
    </div>
  );
}
