-- ============================================================================
--  Discipline Dashboard — Supabase schema (v2: dynamic, schedulable habits)
--  Paste this whole file into the Supabase SQL Editor and click "Run".
--  Safe to re-run: everything uses "if not exists" / "or replace".
--
--  v2 adds custom, user-editable habits with per-weekday scheduling.
--  If you ran v1 earlier, the old `habit_logs` table is now unused and can be
--  dropped safely (uncomment the line below). Your data so far was minimal.
-- ============================================================================

-- drop table if exists public.habit_logs cascade;   -- optional v1 cleanup

-- ----------------------------------------------------------------------------
--  1. profiles  — one row per user. Holds freeze tokens + lifetime metadata.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text,
  freeze_tokens integer not null default 3,
  goal          text,                                 -- north-star goal
  goal_date     date,                                 -- when you want to hit it
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- For projects upgrading from an earlier version of this schema:
alter table public.profiles add column if not exists goal text;
alter table public.profiles add column if not exists goal_date date;

-- ----------------------------------------------------------------------------
--  2. habits — user-defined habits. Targets and schedule live here.
--     active_days: array of weekday numbers the habit is scheduled on
--                  (0 = Sunday … 6 = Saturday). Days not listed = rest days.
--     day_targets: optional per-weekday target overrides, e.g. {"6": 1}
--                  means a different target on Saturday.
-- ----------------------------------------------------------------------------
create table if not exists public.habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  emoji       text not null default '✅',
  type        text not null default 'quantity',   -- 'quantity' | 'boolean'
  unit        text,
  target      numeric(8,1) not null default 1,
  step        numeric(6,1) not null default 1,
  xp          integer not null default 10,
  active_days integer[] not null default '{0,1,2,3,4,5,6}',
  day_targets jsonb,
  sort_order  integer not null default 0,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists habits_user_idx on public.habits (user_id);

-- ----------------------------------------------------------------------------
--  3. habit_entries — one row per habit per day. Stores the logged value.
--     For boolean habits, value is 0 or 1.
-- ----------------------------------------------------------------------------
create table if not exists public.habit_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  habit_id   uuid not null references public.habits (id) on delete cascade,
  log_date   date not null,
  value      numeric(8,1) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

create index if not exists habit_entries_user_date_idx
  on public.habit_entries (user_id, log_date desc);

-- ----------------------------------------------------------------------------
--  4. focus_sessions — completed Pomodoro/focus sessions.
-- ----------------------------------------------------------------------------
create table if not exists public.focus_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  habit_id   uuid references public.habits (id) on delete set null,
  minutes    integer not null default 0,
  log_date   date not null,
  created_at timestamptz not null default now()
);

create index if not exists focus_sessions_user_date_idx
  on public.focus_sessions (user_id, log_date desc);

-- ----------------------------------------------------------------------------
--  4b. push_subscriptions — Web Push endpoints for daily reminders.
-- ----------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

-- ----------------------------------------------------------------------------
--  5. projects — freelancing project tracker.
-- ----------------------------------------------------------------------------
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  deadline     date,
  status       text not null default 'active',
  hours_logged numeric(6,1) not null default 0,
  earnings     numeric(10,2) not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists projects_user_idx on public.projects (user_id);

-- ----------------------------------------------------------------------------
--  6. updated_at auto-touch trigger
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','habits','habit_entries','projects']
  loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s;', t);
    execute format(
      'create trigger touch_%1$s before update on public.%1$s
         for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
--  7. Auto-create a profile row when a new auth user signs up
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
--  8. Row Level Security — each user can only touch their own rows
-- ----------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.habits             enable row level security;
alter table public.habit_entries      enable row level security;
alter table public.focus_sessions     enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.projects           enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "habits_all_own" on public.habits;
create policy "habits_all_own" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "habit_entries_all_own" on public.habit_entries;
create policy "habit_entries_all_own" on public.habit_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "focus_sessions_all_own" on public.focus_sessions;
create policy "focus_sessions_all_own" on public.focus_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "push_subscriptions_all_own" on public.push_subscriptions;
create policy "push_subscriptions_all_own" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "projects_all_own" on public.projects;
create policy "projects_all_own" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
--  Done. Tables: profiles, habits, habit_entries, focus_sessions, projects.
--  Default habits are seeded automatically by the app on first sign-in.
-- ============================================================================
