-- ===========================================================================
-- DAILY SLATE — Ephemeral group chat (run AFTER previous scripts; re-runnable)
-- Supabase dashboard → SQL Editor → New query → paste all → Run.
--
-- Messages are visible ONLY to group members and are hard-deleted after
-- 6 hours: the purge runs every time a chat is opened (RPC below) and again
-- nightly via the grading cron. The UI additionally never displays anything
-- older than the window. No archive is kept.
-- ===========================================================================

create table if not exists public.group_messages (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  sender_id  uuid not null references auth.users (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists group_messages_group_time
  on public.group_messages (group_id, created_at desc);

alter table public.group_messages enable row level security;

-- Members read their group's messages.
drop policy if exists "members read group messages" on public.group_messages;
create policy "members read group messages"
  on public.group_messages for select
  using (public.is_group_member(group_id));

-- Members send as themselves.
drop policy if exists "members send group messages" on public.group_messages;
create policy "members send group messages"
  on public.group_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_group_member(group_id));

-- Senders can delete their own message early.
drop policy if exists "senders delete own messages" on public.group_messages;
create policy "senders delete own messages"
  on public.group_messages for delete to authenticated
  using (sender_id = auth.uid());

-- Purge: anyone opening a chat triggers cleanup of expired messages app-wide.
create or replace function public.purge_old_messages()
returns void
language sql security definer set search_path = public
as $$
  delete from public.group_messages
  where created_at < now() - interval '6 hours';
$$;

grant execute on function public.purge_old_messages() to authenticated;

-- Live updates: stream new messages over Supabase Realtime.
do $$
begin
  alter publication supabase_realtime add table public.group_messages;
exception
  when duplicate_object then null;
end $$;
