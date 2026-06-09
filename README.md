# Daily Slate

**Pick winners. Beat your friends.**

A daily sports pick'em game — Wordle for sports fans. See the day's slate of meaningful games, pick the winners, lock your card, and share a premium graphic to the group chat. Compete on win percentage across friend groups and a global leaderboard.

This is **not** a betting app: no wagering, no odds, no sportsbook language. Just accuracy, streaks, and bragging rights.

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** for styling (custom dark design system)
- **lucide-react** icons, **date-fns** dates, **html-to-image** for share-card PNG export
- Client state via React Context (`lib/store.tsx`) — Supabase-ready architecture, mock data for now

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. No login required — the app uses a mock session (`CURRENT_USER`).

```bash
npm run build && npm start   # production build
```

## Flow

1. **/** — landing → **Make your picks**
2. **/slate** — today's games grouped by sport; tap to pick, then **Lock Picks** (confirmation modal → success overlay)
3. **/share** — auto-generated **Today's Picks** graphic (9:16), with Download / Copy / Share
4. **/my-picks** — your picks with live/final results and daily record
5. **/leaderboard** — Today / This Week / All-Time
6. **/groups** — create a group, join with an invite code, see standings
7. **/profile** — lifetime stats, accuracy, recent results, badges + basic settings

The slate ships with mostly `open` games (so you can pick and lock a full card) plus a seeded `live` and two `final` games to demonstrate every card state.

## Project structure

```
app/            route segments (App Router)
components/     UI: GameCard, PickButton, ShareCard, LeaderboardTable, …
data/           mock games / users / picks / groups / leaderboards
lib/            store (context), scoring, share-image export, date + sport config
types/          Game, Pick, User, Group, LeaderboardEntry
```

## Where real data plugs in later

The mock layer is isolated so it can be swapped for live data without touching UI:

- **Games & scores** — replace `getTodaySlate()` in `data/mockGames.ts` with a fetch against **SportsDataIO**, **API-Sports**, or **ESPN** unofficial endpoints (`site.api.espn.com/.../scoreboard`). Normalize each payload into the `Game` shape. Status transitions (`open → locked → live → final`) come from a cron / Edge Function that polls scores.
- **Favorite / underdog** — sourced from **The Odds API** for the "pick strategy" stat only. No odds or lines are ever shown to the user.
- **Backend** — **Supabase**: `profiles`, `games` (keyed by date), `picks` (unique on `user_id` + `game_id`, locked server-side when a game starts), `groups` + `group_members`. Leaderboards become server-computed aggregates per scope. Swap the mock session in `lib/store.tsx` / `data/mockUsers.ts` for Supabase auth.

Integration points are marked with comments throughout `data/` and `lib/store.tsx`.

## Scoring

Correct pick = 1, wrong = 0. Daily win% = correct ÷ completed (final games only, so an in-progress card never looks artificially low). Badges (Perfect Day, streaks, Underdog Hit, Ran the Slate) derive in `lib/scoring.ts`.
