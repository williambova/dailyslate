-- ===========================================================================
-- DAILY SLATE — Profile images (run AFTER previous scripts; safe to re-run)
-- Supabase dashboard → SQL Editor → New query → paste all → Run.
--
-- Adds an avatar_url to profiles and a public "avatars" storage bucket where
-- each user can upload only into their own folder (named by their user id).
-- ===========================================================================

alter table public.profiles add column if not exists avatar_url text;

-- Public bucket for avatar images.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone can view avatars (the bucket is public anyway).
drop policy if exists "avatar images public read" on storage.objects;
create policy "avatar images public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users can upload/replace files only inside their own folder: {uid}/...
drop policy if exists "users upload own avatar" on storage.objects;
create policy "users upload own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users update own avatar" on storage.objects;
create policy "users update own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete own avatar" on storage.objects;
create policy "users delete own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
