-- ===========================================================================
-- DAILY SLATE — Results history (run AFTER schema.sql + multiplayer.sql)
-- Supabase dashboard → SQL Editor → New query → paste all → Run.
--
-- Stores each day's final winners so picks can be graded forever (history,
-- weekly/all-time win%). Rows are written ONLY by the server grading route
-- using the service-role key (RLS has no insert/update policy, so clients
-- can't tamper with results).
-- ===========================================================================

create table if not exists public.results (
  slate_date text not null,
  game_id    text not null,
  league     text,
  winner     text not null,
  graded_at  timestamptz not null default now(),
  primary key (slate_date, game_id)
);

alter table public.results enable row level security;

-- Everyone can read results (needed to grade picks client-side for display).
drop policy if exists "results readable by everyone" on public.results;
create policy "results readable by everyone"
  on public.results for select using (true);

-- No insert/update/delete policies on purpose: only the service-role key
-- (which bypasses RLS, server-side only) can write results.
