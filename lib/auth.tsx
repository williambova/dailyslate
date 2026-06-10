"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Identity. When Supabase is configured and the user is signed in, `user` is
 * their real profile. Otherwise everyone is a local "guest" (name stored in
 * localStorage). This keeps the app fully working with or without a backend.
 */

export type AuthStatus = "loading" | "guest" | "authed";

const GUEST_KEY = "dailyslate:guest";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "GU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20) || "guest";
}

const GUEST: User = {
  id: "guest",
  name: "Guest",
  username: "guest",
  avatar: "GU",
  overallWinPercentage: 0,
  currentStreak: 0,
  bestDailyRecord: "—",
  perfectDays: 0,
  favoriteSport: "—",
};

function profileToUser(row: any, fallbackName: string): User {
  const name = row?.display_name || fallbackName || "Player";
  return {
    ...GUEST,
    id: row?.id ?? "guest",
    name,
    username: row?.username || slugify(name),
    avatar: initials(name),
    avatarUrl: row?.avatar_url ?? null,
  };
}

interface AuthState {
  status: AuthStatus;
  user: User;
  isAuthed: boolean;
  isConfigured: boolean;
  authUserId: string | null;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ ok: boolean; needsEmailConfirm?: boolean; error?: string }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; needsEmailConfirm?: boolean; error?: string }>;
  signOut: () => Promise<void>;
  setGuestName: (name: string) => void;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? "loading" : "guest"
  );
  const [user, setUser] = useState<User>(GUEST);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  // Guest identity from localStorage (used when signed out).
  const loadGuest = useCallback(() => {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      if (raw) {
        const g = JSON.parse(raw) as User;
        setUser({ ...GUEST, ...g });
        return;
      }
    } catch {
      /* ignore */
    }
    setUser(GUEST);
  }, []);

  const loadProfile = useCallback(async (uid: string, email: string | null) => {
    if (!supabase) return;
    const fallback = email ? email.split("@")[0] : "Player";
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", uid)
        .maybeSingle();
      setUser(profileToUser(data ?? { id: uid }, fallback));
    } catch {
      setUser(profileToUser({ id: uid }, fallback));
    }
    setAuthUserId(uid);
    setStatus("authed");
  }, []);

  // Initial session + auth subscription.
  useEffect(() => {
    if (!supabase) {
      loadGuest();
      setStatus("guest");
      return;
    }
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? null);
      } else {
        loadGuest();
        setStatus("guest");
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? null);
      } else {
        setAuthUserId(null);
        loadGuest();
        setStatus("guest");
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadGuest, loadProfile]);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!supabase) return { ok: false, error: "Accounts aren't configured yet." };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim(), username: slugify(displayName) },
        },
      });
      if (error) return { ok: false, error: error.message };
      // If email confirmation is on, there's no session yet.
      if (!data.session) return { ok: true, needsEmailConfirm: true };
      return { ok: true };
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { ok: false, error: "Accounts aren't configured yet." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setAuthUserId(null);
    loadGuest();
    setStatus("guest");
  }, [loadGuest]);

  const setGuestName = useCallback((name: string) => {
    const clean = name.trim();
    const next: User = {
      ...GUEST,
      id: "guest",
      name: clean || "Guest",
      username: slugify(clean),
      avatar: initials(clean || "Guest"),
    };
    setUser(next);
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!supabase || !authUserId) return;
    const { data } = await supabase.auth.getUser();
    await loadProfile(authUserId, data.user?.email ?? null);
  }, [authUserId, loadProfile]);

  const value: AuthState = {
    status,
    user,
    isAuthed: status === "authed",
    isConfigured: isSupabaseConfigured,
    authUserId,
    signUp,
    signIn,
    signOut,
    setGuestName,
    refreshProfile,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
