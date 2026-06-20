-- ── Sukoon · production persistence schema ──────────────────────────
-- Run this in the Supabase SQL editor (free tier is enough).
-- Every table is locked to its owner via Row-Level Security so a user can
-- only ever read or write their own sensitive wellbeing data.

create extension if not exists "pgcrypto";

-- 1. Identity + exam context + preferences
create table if not exists profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  nickname      text,
  age           int,
  exam          text,
  attempt       text,
  months_to_exam int,
  study_setup   text,
  away_from_family boolean,
  study_hours   int,
  language      text default 'hinglish',
  comm_style    text,
  proactivity   text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 2. The Care Profile (calibration output that drives the whole app)
create table if not exists care_profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  version       int default 1,
  baseline_wellness_index int,
  risk_tier     text,
  top_stressors text[],
  screening_scores jsonb,
  preferences   jsonb,
  persona       jsonb,
  summary       text,
  created_at    timestamptz default now()
);

-- 3. Mood check-ins (8 slider dimensions)
create table if not exists mood_checkins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  ts            timestamptz default now(),
  stress int, sleep int, mood int, motivation int,
  anxiety int, confidence int, loneliness int, energy int,
  wellness_index int,
  note          text,
  source        text default 'manual'
);

-- 4. Conversations + messages
create table if not exists conversations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  initiated_by  text default 'user',
  context       text,
  started_at    timestamptz default now()
);

create table if not exists messages (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid references conversations (id) on delete cascade,
  role          text not null,
  content       text not null,
  metadata      jsonb,
  ts            timestamptz default now()
);

-- 5. Proactive engine queue
create table if not exists proactive_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  type          text not null,
  status        text default 'pending',
  opener        text,
  reason        text,
  created_at    timestamptz default now(),
  sent_at       timestamptz
);

-- 6. Journal
create table if not exists journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  content       text not null,
  mood_tag      text,
  ts            timestamptz default now()
);

-- 7. Coping activity log
create table if not exists coping_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  tool          text not null,
  ts            timestamptz default now()
);

-- 8. Safety audit (crisis triggers)
create table if not exists safety_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  trigger       text,
  severity      text,
  action_taken  text,
  ts            timestamptz default now()
);

-- ── Row-Level Security ──────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','care_profiles','mood_checkins','conversations','messages',
    'proactive_events','journal_entries','coping_logs','safety_events'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy "owner_select_%1$s" on %1$I for select using (
        %2$s
      );$f$, t, case when t = 'profiles' then 'auth.uid() = id' else 'auth.uid() = user_id' end);
    execute format($f$
      create policy "owner_modify_%1$s" on %1$I for all using (
        %2$s
      ) with check (
        %2$s
      );$f$, t, case when t = 'profiles' then 'auth.uid() = id' else 'auth.uid() = user_id' end);
  end loop;
end $$;
