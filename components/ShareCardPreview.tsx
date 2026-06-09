"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Copy, Share2, Check, Loader2 } from "lucide-react";
import { ShareCard } from "./ShareCard";
import { useSlate, useSlateDerived } from "@/lib/store";
import { countByType } from "@/lib/scoring";
import { downloadCard, copyCard, shareCard } from "@/lib/shareImage";
import { shareDate } from "@/lib/date";
import { cn } from "@/lib/cn";

type Busy = "download" | "copy" | "share" | null;

export function ShareCardPreview() {
  const { user, date, games, cardLocked } = useSlate();
  const { picksList } = useSlateDerived();
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.36);
  const [busy, setBusy] = useState<Busy>(null);
  const [copied, setCopied] = useState(false);

  // Scale the 1080px-wide card to fit the phone column.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / 1080);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { favorites, underdogs } = countByType(picksList);
  const fileName = `daily-slate-${shareDate(date).toLowerCase().replace(/\s+/g, "-")}.png`;

  const run = async (kind: Busy, fn: () => Promise<unknown>) => {
    if (!cardRef.current || busy) return;
    setBusy(kind);
    try {
      const ok = await fn();
      if (kind === "copy" && ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } finally {
      setBusy(null);
    }
  };

  if (picksList.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-ink-850/70 p-8 text-center">
        <p className="text-sm text-ink-600">
          Make some picks on today&apos;s slate to generate your share card.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Scaled preview frame */}
      <div
        ref={frameRef}
        className="relative w-full overflow-hidden rounded-3xl border border-line shadow-card"
        style={{ aspectRatio: "1080 / 1920" }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <ShareCard
            ref={cardRef}
            userName={user.name}
            date={date}
            games={games}
            picks={picksList}
            totalGames={picksList.length}
            lockedStatus={cardLocked ? "All picks locked" : "Picks in progress"}
            favoritesCount={favorites}
            underdogsCount={underdogs}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <ActionButton
          label={busy === "download" ? "Saving…" : "Download"}
          icon={busy === "download" ? Loader2 : Download}
          spinning={busy === "download"}
          onClick={() => run("download", () => downloadCard(cardRef.current!, fileName))}
          disabled={!!busy}
        />
        <ActionButton
          label={copied ? "Copied!" : busy === "copy" ? "Copying…" : "Copy"}
          icon={copied ? Check : busy === "copy" ? Loader2 : Copy}
          spinning={busy === "copy"}
          highlight={copied}
          onClick={() => run("copy", () => copyCard(cardRef.current!))}
          disabled={!!busy}
        />
        <ActionButton
          label={busy === "share" ? "Sharing…" : "Share"}
          icon={busy === "share" ? Loader2 : Share2}
          spinning={busy === "share"}
          onClick={() => run("share", () => shareCard(cardRef.current!, fileName))}
          disabled={!!busy}
        />
      </div>
      <p className="mt-3 text-center text-[11px] text-ink-600">
        Optimized for Instagram Stories, iMessage &amp; group chats · 9:16
      </p>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  spinning,
  highlight,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  spinning?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 rounded-2xl border py-3.5 text-xs font-bold uppercase tracking-wide transition active:scale-95 disabled:opacity-60",
        highlight
          ? "border-lime/50 bg-lime/15 text-lime"
          : "border-line bg-ink-800 text-white/85 hover:border-white/20"
      )}
    >
      <Icon className={cn("h-5 w-5", spinning && "animate-spin")} />
      {label}
    </button>
  );
}
