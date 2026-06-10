"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Game, Pick } from "@/types";
import { pickTypeFor } from "@/lib/scoring";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * Slate state: today's REAL games (ESPN via /api/slate) + the user's picks.
 * Identity comes from useAuth(). Picks persist to Supabase when signed in,
 * otherwise to localStorage (guest). Cloud writes are best-effort: the local
 * state is always the in-session source of truth, so a write hiccup never
 * blocks picking.
 */

export type SlateSource = "loading" | "live" | "empty" | "error";

const PICKS_KEY = "dailyslate:picks";

interface SlateState {
  user: ReturnType<typeof useAuth>["user"];
  isGuest: boolean;
  setDisplayName: (name: string) => void;
  date: Date;
  games: Game[];
  picks: Record<string, Pick>;
  cardLocked: boolean;
  source: SlateSource;
  loading: boolean;
  selectTeam: (gameId: string, team: string) => void;
  clearPick: (gameId: string) => void;
  lockPicks: () => void;
  isEditable: (game: Game) => boolean;
  reload: () => void;
  slateKey: string;
}

const Ctx = createContext<SlateState | null>(null);

export function SlateProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthed, authUserId, status, setGuestName } = useAuth();

  const [games, setGames] = useState<Game[]>([]);
  const [date, setDate] = useState<Date>(() => new Date());
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [cardLocked, setCardLocked] = useState(false);
  const [source, setSource] = useState<SlateSource>("loading");
  const [slateKey, setSlateKey] = useState<string>("");

  // 1) Fetch today's real slate (games only — picks load separately).
  const load = useCallback(async () => {
    setSource("loading");
    try {
      const res = await fetch("/api/slate", { cache: "no-store" });
      if (!res.ok) {
        setSource("error");
        return;
      }
      const data = await res.json();
      const list: Game[] = Array.isArray(data.games) ? data.games : [];
      const d = data.date ? new Date(data.date) : new Date();
      const key = (data.date as string) ?? d.toISOString().slice(0, 10);
      setGames(list);
      setDate(d);
      setSlateKey(key);
      setSource(list.length > 0 ? "live" : "empty");
    } catch {
      setSource("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 2) Load this slate's picks once we know the slate + auth state.
  useEffect(() => {
    if (!slateKey || status === "loading") return;
    let active = true;

    const fromLocal = () => {
      try {
        const raw = localStorage.getItem(`${PICKS_KEY}:${slateKey}`);
        if (raw) {
          const saved = JSON.parse(raw) as {
            picks: Record<string, Pick>;
            cardLocked: boolean;
          };
          const valid: Record<string, Pick> = {};
          for (const g of games) if (saved.picks?.[g.id]) valid[g.id] = saved.picks[g.id];
          if (active) {
            setPicks(valid);
            setCardLocked(!!saved.cardLocked);
          }
          return;
        }
      } catch {
        /* ignore */
      }
      if (active) {
        setPicks({});
        setCardLocked(false);
      }
    };

    const fromCloud = async () => {
      if (!supabase || !authUserId) return fromLocal();
      try {
        const { data, error } = await supabase
          .from("picks")
          .select("game_id, selected_team, pick_type, is_locked, created_at")
          .eq("user_id", authUserId)
          .eq("slate_date", slateKey);
        if (error) throw error;
        const map: Record<string, Pick> = {};
        let locked = false;
        for (const r of data ?? []) {
          map[r.game_id] = {
            id: `p_${r.game_id}`,
            userId: authUserId,
            gameId: r.game_id,
            selectedTeam: r.selected_team,
            isLocked: r.is_locked,
            isCorrect: null,
            pickType: r.pick_type,
            createdAt: r.created_at ?? new Date().toISOString(),
          };
          if (r.is_locked) locked = true;
        }
        if (active) {
          setPicks(map);
          setCardLocked(locked);
        }
      } catch {
        // Fall back to whatever is cached locally if the read fails.
        fromLocal();
      }
    };

    if (isAuthed) fromCloud();
    else fromLocal();

    return () => {
      active = false;
    };
  }, [slateKey, status, isAuthed, authUserId, games]);

  // Persist helpers.
  const persistLocal = useCallback(
    (nextPicks: Record<string, Pick>, locked: boolean) => {
      if (!slateKey) return;
      try {
        localStorage.setItem(
          `${PICKS_KEY}:${slateKey}`,
          JSON.stringify({ picks: nextPicks, cardLocked: locked })
        );
      } catch {
        /* ignore */
      }
    },
    [slateKey]
  );

  const isEditable = useCallback(
    (game: Game) => game.status === "open" && !picks[game.id]?.isLocked,
    [picks]
  );

  const selectTeam = useCallback(
    (gameId: string, team: string) => {
      const game = games.find((g) => g.id === gameId);
      if (!game || game.status !== "open") return;
      if (picks[gameId]?.isLocked) return;

      const next: Pick = {
        id: picks[gameId]?.id ?? `p_${gameId}_${Date.now()}`,
        userId: user.id,
        gameId,
        selectedTeam: team,
        isLocked: false,
        isCorrect: null,
        pickType: pickTypeFor(team, game),
        createdAt: new Date().toISOString(),
      };
      const nextPicks = { ...picks, [gameId]: next };
      setPicks(nextPicks);

      if (isAuthed && supabase && authUserId) {
        supabase
          .from("picks")
          .upsert(
            {
              user_id: authUserId,
              slate_date: slateKey,
              game_id: gameId,
              league: game.league,
              selected_team: team,
              pick_type: next.pickType,
              is_locked: false,
            },
            { onConflict: "user_id,slate_date,game_id" }
          )
          .then(({ error }) => error && console.error("pick save failed", error.message));
      } else {
        persistLocal(nextPicks, cardLocked);
      }
    },
    [games, picks, user.id, isAuthed, authUserId, slateKey, cardLocked, persistLocal]
  );

  const clearPick = useCallback(
    (gameId: string) => {
      if (picks[gameId]?.isLocked) return;
      const nextPicks = { ...picks };
      delete nextPicks[gameId];
      setPicks(nextPicks);

      if (isAuthed && supabase && authUserId) {
        supabase
          .from("picks")
          .delete()
          .eq("user_id", authUserId)
          .eq("slate_date", slateKey)
          .eq("game_id", gameId)
          .then(({ error }) => error && console.error("pick delete failed", error.message));
      } else {
        persistLocal(nextPicks, cardLocked);
      }
    },
    [picks, isAuthed, authUserId, slateKey, cardLocked, persistLocal]
  );

  const lockPicks = useCallback(() => {
    const nextPicks: Record<string, Pick> = {};
    for (const [gid, p] of Object.entries(picks)) nextPicks[gid] = { ...p, isLocked: true };
    setPicks(nextPicks);
    setCardLocked(true);

    if (isAuthed && supabase && authUserId) {
      supabase
        .from("picks")
        .update({ is_locked: true })
        .eq("user_id", authUserId)
        .eq("slate_date", slateKey)
        .then(({ error }) => error && console.error("lock failed", error.message));
    } else {
      persistLocal(nextPicks, true);
    }
  }, [picks, isAuthed, authUserId, slateKey, persistLocal]);

  const value: SlateState = {
    user,
    isGuest: !isAuthed,
    setDisplayName: setGuestName,
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
    reload: load,
    slateKey,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSlate(): SlateState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSlate must be used within <SlateProvider>");
  return ctx;
}

export function useSlateDerived() {
  const { games, picks } = useSlate();
  const picksList = Object.values(picks);
  const made = picksList.length;
  const total = games.length;
  const allMade = total > 0 && made === total;
  return { picksList, made, total, allMade };
}
