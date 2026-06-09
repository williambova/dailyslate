"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Game, Pick } from "@/types";
import { getTodaySlate, SLATE_DATE } from "@/data/mockGames";
import { seededPicks } from "@/data/mockPicks";
import { CURRENT_USER } from "@/data/mockUsers";
import { pickTypeFor } from "@/lib/scoring";

/**
 * Single source of truth for the live session: the slate, the current user's
 * picks, and the lock state.
 *
 * Data source: on mount we fetch /api/slate (real ESPN games for today). If
 * that returns games, we use them ("live"). If it's empty or unreachable we
 * fall back to the bundled mock slate ("mock") so the app always renders.
 * In production this becomes a thin layer over Supabase (realtime on `games`,
 * optimistic writes to `picks`).
 */

export type SlateSource = "live" | "mock" | "loading";

interface SlateState {
  user: typeof CURRENT_USER;
  date: Date;
  games: Game[];
  picks: Record<string, Pick>; // keyed by gameId
  cardLocked: boolean;
  source: SlateSource;
  loading: boolean;
  selectTeam: (gameId: string, team: string) => void;
  clearPick: (gameId: string) => void;
  lockPicks: () => void;
  isEditable: (game: Game) => boolean;
}

const Ctx = createContext<SlateState | null>(null);

function seedMap(): Record<string, Pick> {
  return Object.fromEntries(seededPicks.map((p) => [p.gameId, p]));
}

export function SlateProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [date, setDate] = useState<Date>(SLATE_DATE);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [cardLocked, setCardLocked] = useState(false);
  const [source, setSource] = useState<SlateSource>("loading");

  // Load today's real slate; fall back to mock.
  useEffect(() => {
    let cancelled = false;

    const useMock = () => {
      if (cancelled) return;
      setGames(getTodaySlate());
      setDate(SLATE_DATE);
      setPicks(seedMap()); // seeded picks demo live/final card states
      setSource("mock");
    };

    (async () => {
      try {
        const res = await fetch("/api/slate", { cache: "no-store" });
        if (!res.ok) throw new Error("bad status");
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data.games) && data.games.length > 0) {
          setGames(data.games);
          setDate(data.date ? new Date(data.date) : new Date());
          setPicks({}); // real games carry their own live/final states
          setSource("live");
        } else {
          useMock();
        }
      } catch {
        useMock();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isEditable = useCallback(
    (game: Game) => game.status === "open" && !picks[game.id]?.isLocked,
    [picks]
  );

  const selectTeam = useCallback(
    (gameId: string, team: string) => {
      const game = games.find((g) => g.id === gameId);
      if (!game || game.status !== "open") return;
      setPicks((prev) => {
        if (prev[gameId]?.isLocked) return prev;
        const next: Pick = {
          id: prev[gameId]?.id ?? `p_${gameId}_${Date.now()}`,
          userId: CURRENT_USER.id,
          gameId,
          selectedTeam: team,
          isLocked: false,
          isCorrect: null,
          pickType: pickTypeFor(team, game),
          createdAt: new Date().toISOString(),
        };
        return { ...prev, [gameId]: next };
      });
    },
    [games]
  );

  const clearPick = useCallback((gameId: string) => {
    setPicks((prev) => {
      if (prev[gameId]?.isLocked) return prev;
      const next = { ...prev };
      delete next[gameId];
      return next;
    });
  }, []);

  const lockPicks = useCallback(() => {
    setPicks((prev) => {
      const next: Record<string, Pick> = {};
      for (const [gid, p] of Object.entries(prev)) next[gid] = { ...p, isLocked: true };
      return next;
    });
    setCardLocked(true);
  }, []);

  const value: SlateState = {
    user: CURRENT_USER,
    date,
    games,
    picks,
    cardLocked,
    source,
    loading: source === "loading",
    selectTeam,
    clearPick,
    lockPicks,
    isEditable,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSlate(): SlateState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSlate must be used within <SlateProvider>");
  return ctx;
}

/** Derived helpers used across screens. */
export function useSlateDerived() {
  const { games, picks } = useSlate();
  const picksList = Object.values(picks);
  const made = picksList.length;
  const total = games.length;
  const allMade = total > 0 && made === total;
  return { picksList, made, total, allMade };
}
