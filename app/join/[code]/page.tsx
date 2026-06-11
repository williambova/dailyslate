"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, LogIn, Check, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { joinGroup } from "@/lib/groups";
import { Wordmark } from "@/components/Wordmark";

/**
 * Invite link landing: dailyslate.io/join/SLATE-XXXX
 *
 * Friend taps the link → if signed out, they're sent to /login?next=/join/CODE
 * (sign-up and group-join become one flow) → on return, we auto-join via the
 * join_group_by_code RPC and drop them on today's slate.
 */
export default function JoinPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code ?? "").toUpperCase();
  const router = useRouter();
  const { status, isAuthed, isConfigured } = useAuth();

  const [state, setState] = useState<"idle" | "joining" | "joined" | "error">(
    "idle"
  );
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const attempted = useRef(false);

  // Signed in → join automatically (once).
  useEffect(() => {
    if (status === "loading" || !isAuthed || attempted.current || !code) return;
    attempted.current = true;
    setState("joining");
    joinGroup(code)
      .then((g) => {
        setGroupName(g.name);
        setState("joined");
      })
      .catch((e: any) => {
        setError(e?.message ?? "Couldn't join with that code.");
        setState("error");
      });
  }, [status, isAuthed, code]);

  return (
    <div className="app-bg flex min-h-screen flex-col px-6 pb-10 pt-8">
      <div className="mx-auto w-full max-w-[420px]">
        <Wordmark size="md" />

        <div className="mt-10 rounded-3xl border border-line bg-ink-850/60 p-6">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lime/15">
            <Users className="h-6 w-6 text-lime" />
          </span>

          {/* Signed out → the onboarding hook */}
          {status !== "loading" && !isAuthed && (
            <>
              <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
                You&apos;re invited.
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                A friend wants you in their Daily Slate group{" "}
                <span className="tnum font-bold text-white/80">{code}</span> —
                pick today&apos;s games, lock your card, and battle for the best
                win percentage.
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(`/join/${code}`)}`}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime py-4 text-base font-extrabold uppercase tracking-wide text-ink-950 transition active:scale-95"
              >
                <LogIn className="h-5 w-5" />
                Sign up & join
              </Link>
              <p className="mt-2.5 text-center text-[12px] text-ink-600">
                Have an account? Same button — you can sign in there too.
              </p>
              {!isConfigured && (
                <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-3 text-[12px] text-amber-200/90">
                  Accounts aren&apos;t switched on in this environment yet.
                </p>
              )}
            </>
          )}

          {/* Joining */}
          {(status === "loading" || state === "joining") && isAuthedOrLoading(status, isAuthed) && (
            <>
              <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
                Joining…
              </h1>
              <p className="mt-1.5 text-sm text-ink-600">
                Adding you to the group.
              </p>
            </>
          )}

          {/* Success */}
          {state === "joined" && (
            <>
              <h1 className="mt-4 flex items-center gap-2 text-2xl font-extrabold tracking-tight">
                <Check className="h-6 w-6 text-lime" strokeWidth={3} />
                You&apos;re in.
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                Welcome to{" "}
                <span className="font-bold text-white/90">{groupName}</span>.
                Make your picks before tonight&apos;s games lock.
              </p>
              <button
                onClick={() => router.push("/slate")}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime py-4 text-base font-extrabold uppercase tracking-wide text-ink-950 transition active:scale-95"
              >
                Make your picks
                <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <Link
                href="/groups"
                className="mt-2.5 flex w-full items-center justify-center rounded-2xl border border-line bg-ink-850 py-3.5 text-sm font-bold text-white/85"
              >
                See the group
              </Link>
            </>
          )}

          {/* Error */}
          {state === "error" && (
            <>
              <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
                Hmm, that didn&apos;t work.
              </h1>
              <p className="mt-1.5 text-sm font-semibold text-red-400">{error}</p>
              <Link
                href="/groups"
                className="mt-5 flex w-full items-center justify-center rounded-2xl border border-line bg-ink-850 py-3.5 text-sm font-bold text-white/85"
              >
                Go to groups
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function isAuthedOrLoading(status: string, isAuthed: boolean) {
  return status === "loading" || isAuthed;
}
