-- ===========================================================================
-- DAILY SLATE — Supabase schema
-- Run ONCE: Supabase dashboard → SQL Editor → New query → paste all → Run.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE).
-- ===========================================================================

-- 1) PROFILES -----------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique,
  display_name text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles readable by everyone" on public.profiles;
create policy "profiles readable by everyone"
  on public.profiles for select using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) PICKS --------------------------------------------------------------------
create table if not exists public.picks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  slate_date    text not null,
  game_id       text not null,
  league        text,
  selected_team text not null,
  pick_type     text not null,
  is_locked     boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (user_id, slate_date, game_id)
);

alter table public.picks enable row level security;

drop policy if exists "users read own picks" on public.picks;
create policy "users read own picks"
  on public.picks for select using (auth.uid() = user_id);

drop policy if exists "users insert own picks" on public.picks;
create policy "users insert own picks"
  on public.picks for insert with check (auth.uid() = user_id);

drop policy if exists "users update own picks" on public.picks;
create policy "users update own picks"
  on public.picks for update using (auth.uid() = user_id);

drop policy if exists "users delete own picks" on public.picks;
create policy "users delete own picks"
  on public.picks for delete using (auth.uid() = user_id);

-- 3) GROUPS + MEMBERSHIP  (wired up in the multiplayer step) -------------------
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique not null,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

drop policy if exists "members read their groups" on public.groups;
create policy "members read their groups"
  on public.groups for select
  using (exists (
    select 1 from public.group_members m
    where m.group_id = id and m.user_id = auth.uid()
  ));

drop policy if exists "authed create groups" on public.groups;
create policy "authed create groups"
  on public.groups for insert with check (auth.uid() = owner_id);

-- Kept simple to avoid RLS recursion: you can see your own membership rows.
drop policy if exists "users read own membership" on public.group_members;
create policy "users read own membership"
  on public.group_members for select using (user_id = auth.uid());

drop policy if exists "users join groups" on public.group_members;
create policy "users join groups"
  on public.group_members for insert with check (user_id = auth.uid());
