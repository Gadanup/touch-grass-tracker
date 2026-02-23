-- ─────────────────────────────────────────────────────────────────────────────
-- TouchGrass Tracker — Supabase Schema
-- Paste this entire file into: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid references auth.users on delete cascade primary key,
  display_name  text        not null,
  avatar_url    text,
  avatar_emoji  text        not null default '🌿',
  avatar_color  text        not null default '#ea6c1e',
  timezone      text        not null default 'UTC',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Schedules ────────────────────────────────────────────────────────────────
create table if not exists schedules (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references profiles(id) on delete cascade,
  title        text,
  type         text        not null check (type in ('busy', 'available', 'maybe')),
  is_all_day   boolean     not null default false,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  repeat_rule  text,        -- null | 'daily' | 'weekly'
  note         text,
  created_at   timestamptz not null default now(),

  constraint ends_after_starts check (ends_at > starts_at)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists schedules_user_id_idx   on schedules(user_id);
create index if not exists schedules_starts_at_idx on schedules(starts_at);
create index if not exists schedules_range_idx     on schedules(starts_at, ends_at);

-- ── Auto-update updated_at ────────────────────────────────────────────────────
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure handle_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table profiles  enable row level security;
alter table schedules enable row level security;

-- Profiles: any authenticated user can read all rows (closed friend group)
-- Only the owner can write their own row
drop policy if exists "profiles_select_all" on profiles;
drop policy if exists "profiles_write_own"  on profiles;

create policy "profiles_select_all"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "profiles_write_own"
  on profiles for all
  using      (auth.uid() = id)
  with check (auth.uid() = id);

-- Schedules: any authenticated user can read all rows
-- Only the owner can write their own rows
drop policy if exists "schedules_select_all" on schedules;
drop policy if exists "schedules_write_own"  on schedules;

create policy "schedules_select_all"
  on schedules for select
  using (auth.role() = 'authenticated');

create policy "schedules_write_own"
  on schedules for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Storage: avatars bucket ───────────────────────────────────────────────────
-- Do this manually in the Supabase Dashboard (SQL can't create storage buckets):
--
--   1. Storage → New bucket
--      Name: avatars
--      Public bucket: ✅ ON
--
--   2. Storage → avatars → Policies → Add policy (repeat for each below):
--
--   Policy 1 — Public read (anyone can view avatars)
--     Operation : SELECT
--     Roles     : public (anon)
--     USING     : true
--
--   Policy 2 — Authenticated upload to own folder
--     Operation : INSERT
--     Roles     : authenticated
--     WITH CHECK: (bucket_id = 'avatars'
--                  AND auth.uid()::text = (storage.foldername(name))[1])
--
--   Policy 3 — Own avatar update
--     Operation : UPDATE
--     Roles     : authenticated
--     USING     : auth.uid()::text = (storage.foldername(name))[1]
--
--   Policy 4 — Own avatar delete
--     Operation : DELETE
--     Roles     : authenticated
--     USING     : auth.uid()::text = (storage.foldername(name))[1]
--
-- Avatar files will be uploaded to: avatars/{user_id}/avatar.{ext}
-- ─────────────────────────────────────────────────────────────────────────────