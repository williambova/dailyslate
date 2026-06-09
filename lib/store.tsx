"use client";

import React, {
  createContext,
  useCallback,
  useContext,
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
 * picks, and the lock state. In production this becomes a thin layer over
 * Supabase (realtime subscription on `games`, optimistic writes to `picks`).
 */

interface SlateState {
  user: typeof CURRENT_USER;
  date: Date;
  games: Game[];
  picks: Record<string, Pick>; // keyed by gameId
  cardLocked: boolean; // user has tapped "Lock Picks" at least once today
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
  const games = useMemo(() => getTodaySlate(), []);
  const [picks, setPicks] = useState<Record<string, Pick>>(seedMap);
  const [cardLocked, setCardLocked] = useState(false);

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
    date: SLATE_DATE,
    games,
    picks,
    cardLocked,
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
  const allMade = made === total;
  return { picksList, made, total, allMade };
}
