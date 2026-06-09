-- ===========================================================================
-- DAILY SLATE — Multiplayer patch (run AFTER schema.sql)
-- Supabase dashboard → SQL Editor → New query → paste all → Run.
-- Safe to re-run.
--
-- Adds: members can see their groups + fellow members, group-mates can read
-- each other's LOCKED picks (for standings), and a join-by-invite-code RPC.
-- ===========================================================================

-- Helper: am I a member of this group? (security definer avoids RLS recursion)
create or replace function public.is_group_member(gid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

-- Helper: do I share at least one group with this user?
create or replace function public.shares_group_with(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = target
  );
$$;

-- GROUPS: owners and members can read their groups.
drop policy if exists "members read their groups" on public.groups;
create policy "members read their groups"
  on public.groups for select
  using (owner_id = auth.uid() or public.is_group_member(id));

-- GROUP_MEMBERS: see your own rows AND everyone in groups you belong to.
drop policy if exists "users read own membership" on public.group_members;
create policy "users read own membership"
  on public.group_members for select
  using (user_id = auth.uid() or public.is_group_member(group_id));

-- PICKS: group-mates can read each other's LOCKED picks (standings only).
-- (Your own-picks policies from schema.sql stay; policies OR together.)
drop policy if exists "group mates read locked picks" on public.picks;
create policy "group mates read locked picks"
  on public.picks for select
  using (is_locked = true and public.shares_group_with(user_id));

-- JOIN BY CODE: looks the code up and adds the caller as a member.
-- Security definer so the lookup works before you're a member.
create or replace function public.join_group_by_code(code text)
returns table (id uuid, name text, invite_code text)
language plpgsql security definer set search_path = public
as $$
declare
  g public.groups%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in to join a group.';
  end if;

  select * into g from public.groups
  where upper(groups.invite_code) = upper(trim(code));

  if not found then
    raise exception 'No group found for that code.';
  end if;

  insert into public.group_members (group_id, user_id)
  values (g.id, auth.uid())
  on conflict do nothing;

  return query select g.id, g.name, g.invite_code;
end;
$$;

grant execute on function public.join_group_by_code(text) to authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.shares_group_with(uuid) to authenticated;
