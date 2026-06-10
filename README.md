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
  api/slate/    server route: today's real games from ESPN
components/     UI: Sidebar, GameCard, PickButton, ShareCard, LeaderboardTable, …
data/           mock fallback: games / users / picks / groups / leaderboards
lib/            store (context), espn adapter, scoring, share-image, date + sport config
types/          Game, Pick, User, Group, LeaderboardEntry
```

## Live data (ESPN)

Real games now load from ESPN's free, unofficial scoreboard API — **no API key required**.

- `lib/espn.ts` — maps ESPN's scoreboard JSON into our `Game` shape (status `pre→open` / `in→live` / `post→final`, scores, winner, and a favorite/underdog label derived from odds when present). Non-two-team payloads (UFC cards, golf leaderboards) are skipped.
- `app/api/slate/route.ts` — `GET /api/slate?date=YYYYMMDD` aggregates today's games across the supported leagues **server-side** (so ESPN is never exposed to the browser and there's no CORS), caps busy slates per league, and caches upstream 60s. Date defaults to "today" in US Eastern.
- `lib/store.tsx` — fetches `/api/slate` on load and uses the live games; if it's empty or unreachable it falls back to the bundled mock slate. The Slate screen shows a **Live** / **Demo data** indicator so you always know which is active.

Supported leagues: NBA, WNBA, NFL, MLB, NHL, NCAAF, NCAAB, College Baseball, EPL, Champions League, MLS. Edit the `ESPN_ENDPOINTS` map in `lib/espn.ts` or the `LEAGUES` / `MAX_PER_LEAGUE` config in the route to change coverage or curate to featured games.

> ESPN's endpoints are unofficial and can change without notice. The route caches and fails gracefully; for production scale, consider a paid feed (SportsDataIO, API-Sports) behind the same `Game` interface, or proxy ESPN through a gateway.

## Responsive layout

- **Mobile**: a centered phone column with a top header and a bottom tab bar.
- **Desktop (≥ `lg`)**: a left sidebar for navigation + a wider content area with a two-column game grid. The mobile header and bottom nav hide themselves at `lg`, so desktop is a real desktop layout — not a stretched phone, and vice versa.

## Where the rest plugs in later

- **Favorite / underdog** comes from ESPN odds when available (display-only, for the "pick strategy" stat). No odds or lines are ever shown to the user.
- **Backend** — **Supabase**: `profiles`, `games` (persist the daily slate keyed by date from `/api/slate`), `picks` (unique on `user_id` + `game_id`, locked server-side when a game starts), `groups` + `group_members`. Leaderboards become server-computed aggregates over the picks table joined to final games. Swap the mock session in `data/mockUsers.ts` for Supabase auth.

Integration points are marked with comments throughout `lib/` and `data/`.

## Scoring

Correct pick = 1, wrong = 0. Daily win% = correct ÷ completed (final games only, so an in-progress card never looks artificially low). Badges (Perfect Day, streaks, Underdog Hit, Ran the Slate) derive in `lib/scoring.ts`.
