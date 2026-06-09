import type { Pick } from "@/types";

/**
 * MOCK DATA — the current user's pre-seeded picks for today.
 * These represent games already decided/in-progress so the slate shows live
 * + final card states out of the box (a correct one, a wrong one, a pending
 * live one). The user picks the remaining `open` games during the session.
 *
 * Later: persist picks to Supabase (table: picks) with a unique
 * (user_id, game_id) constraint; lock server-side when game.status flips.
 */
export const seededPicks: Pick[] = [
  {
    id: "p_seed_g5",
    userId: "u_me",
    gameId: "g5",
    selectedTeam: "Dodgers",
    isLocked: true,
    isCorrect: null, // live
    pickType: "favorite",
    createdAt: "2026-06-08T11:00:00",
  },
  {
    id: "p_seed_g7",
    userId: "u_me",
    gameId: "g7",
    selectedTeam: "Stars",
    isLocked: true,
    isCorrect: true, // final — correct
    pickType: "favorite",
    createdAt: "2026-06-08T11:00:00",
  },
  {
    id: "p_seed_g12",
    userId: "u_me",
    gameId: "g12",
    selectedTeam: "Pavlovich",
    isLocked: true,
    isCorrect: false, // final — wrong
    pickType: "favorite",
    createdAt: "2026-06-08T11:00:00",
  },
];
