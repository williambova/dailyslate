"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User as UserIcon, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Wordmark } from "@/components/Wordmark";

/**
 * Email/password sign in + sign up. If Supabase isn't configured yet, this
 * explains that and points back — the rest of the app still works as a guest.
 */
export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, isConfigured, isAuthed } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async () => {
    setError("");
    setInfo("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Pick a display name.");
      return;
    }
    setBusy(true);
    const res =
      mode === "signup"
        ? await signUp(email.trim(), password, name)
        : await signIn(email.trim(), password);
    setBusy(false);

    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    if (res.needsEmailConfirm) {
      setInfo("Check your email to confirm your account, then sign in.");
      setMode("signin");
      return;
    }
    router.push("/slate");
  };

  return (
    <div className="app-bg flex min-h-screen flex-col px-6 pb-10 pt-8">
      <div className="mx-auto w-full max-w-[420px]">
        <Link
          href="/profile"
          className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <Wordmark size="md" />

        <h1 className="mt-8 text-3xl font-extrabold tracking-tight">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-sm text-ink-600">
          {mode === "signup"
            ? "Save your picks and compete with friends."
            : "Sign in to pick up where you left off."}
        </p>

        {!isConfigured && (
          <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-4 text-[13px] leading-relaxed text-amber-200/90">
            Accounts aren&apos;t switched on yet. The app works fully as a guest
            — accounts activate once the Supabase keys are added.
          </div>
        )}

        {isAuthed && (
          <div className="mt-5 rounded-2xl border border-lime/30 bg-lime/[0.07] p-4 text-[13px] text-lime">
            You&apos;re already signed in.
          </div>
        )}

        <div className="mt-6 space-y-3">
          {mode === "signup" && (
            <Field icon={UserIcon}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Display name"
                className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-ink-600"
              />
            </Field>
          )}
          <Field icon={Mail}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-ink-600"
            />
          </Field>
          <Field icon={Lock}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-ink-600"
            />
          </Field>
        </div>

        {error && <p className="mt-3 text-[13px] font-semibold text-red-400">{error}</p>}
        {info && <p className="mt-3 text-[13px] font-semibold text-lime">{info}</p>}

        <button
          onClick={submit}
          disabled={busy || !isConfigured}
          className="mt-5 w-full rounded-2xl bg-lime py-4 text-base font-extrabold uppercase tracking-wide text-ink-950 transition active:scale-95 disabled:opacity-50"
        >
          {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>

        <button
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError("");
            setInfo("");
          }}
          className="mt-4 w-full text-center text-[13px] font-semibold text-ink-600"
        >
          {mode === "signup" ? (
            <>Already have an account? <span className="text-lime">Sign in</span></>
          ) : (
            <>New here? <span className="text-lime">Create an account</span></>
          )}
        </button>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-ink-900 px-4 py-3.5 focus-within:border-lime/50">
      <Icon className="h-4.5 w-4.5 shrink-0 text-ink-600" />
      {children}
    </div>
  );
}
