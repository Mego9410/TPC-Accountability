-- =============================================================================
-- The Principals Club — schema
--
-- One model for the whole product (see lib/domain.ts). A member belongs to one
-- or more *circles* (a pair or a pod). Inside a circle they are a peer, a
-- mentee, a mentor, or the lead. Every member runs twelve-week *goal blocks* of
-- weekly *commitments*, checks in once a week, logs *wins*, and reports figures
-- to the *benchmark*. Mentors see their mentees' progress and leave *notes*.
--
-- Column names are snake_case; the app maps them to camelCase at the door
-- (lib/repo/supabase/mappers.ts). Policies live in 0002, functions in 0003,
-- the template catalogue in 0004.
-- =============================================================================

create extension if not exists "pgcrypto";

-- Membership numbers echo the Club's "No. 0148" convention: the first real
-- member is 0149.
create sequence if not exists public.membership_seq start with 149;

-- -----------------------------------------------------------------------------
-- regions — the twelve UK regions used for benchmark cohorting.
-- Mirrors REGIONS in lib/benchmarks.ts; keep the two lists in step.
-- -----------------------------------------------------------------------------
create table if not exists public.regions (
  name text primary key
);

insert into public.regions (name) values
  ('London'),
  ('South East'),
  ('South West'),
  ('East of England'),
  ('East Midlands'),
  ('West Midlands'),
  ('Yorkshire and the Humber'),
  ('North West'),
  ('North East'),
  ('Wales'),
  ('Scotland'),
  ('Northern Ireland')
on conflict (name) do nothing;

-- -----------------------------------------------------------------------------
-- profiles — one row per auth user, created by trigger on sign-up.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  honorific          text not null default 'Dr',
  full_name          text not null default '',
  email              text,
  practice_name      text,
  region             text references public.regions (name) on update cascade on delete set null,
  practice_type      text check (practice_type in ('NHS', 'Private', 'Mixed')),
  chair_count        int check (chair_count is null or chair_count >= 0),
  years_as_principal int check (years_as_principal is null or years_as_principal >= 0),
  timezone           text not null default 'Europe/London',
  bio                text,
  membership_no      text not null unique default lpad(nextval('public.membership_seq')::text, 4, '0'),
  role               text not null default 'member' check (role in ('member', 'mentor', 'staff')),
  tier               text not null default 'member' check (tier in ('member', 'society')),
  onboarded          boolean not null default false,
  focus_areas        text[] not null default '{}',
  cadence            text not null default 'weekly' check (cadence in ('weekly', 'fortnightly', 'monthly')),
  preferred_times    text[] not null default '{}',
  -- Mentors only: how many mentees they will take, and the note shown to them.
  mentor_capacity    int check (mentor_capacity is null or mentor_capacity >= 0),
  mentor_note        text,
  consistency_score  numeric not null default 0,
  nudge_opt_out      boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_region_type_idx on public.profiles (region, practice_type);

-- -----------------------------------------------------------------------------
-- circles — a pair (mentor + mentee, or two peers) or a pod (4–6 members).
-- -----------------------------------------------------------------------------
create table if not exists public.circles (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('pair', 'pod')),
  name         text not null,
  cadence      text not null default 'weekly' check (cadence in ('weekly', 'fortnightly', 'monthly')),
  cohort_label text,                                   -- e.g. '2026 Q3'
  status       text not null default 'active' check (status in ('active', 'archived')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.circle_members (
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null default 'peer' check (role in ('peer', 'mentee', 'mentor', 'lead')),
  joined_at timestamptz not null default now(),
  left_at   timestamptz,                               -- null while a current member
  primary key (circle_id, user_id)
);
create index if not exists circle_members_user_idx on public.circle_members (user_id) where left_at is null;

-- -----------------------------------------------------------------------------
-- sittings — a circle's scheduled conversations, held over video. A morning
-- inside somebody's practice is not a sitting; it is a visit (below).
-- -----------------------------------------------------------------------------
create table if not exists public.sittings (
  id           uuid primary key default gen_random_uuid(),
  circle_id    uuid not null references public.circles (id) on delete cascade,
  scheduled_at timestamptz not null,
  status       text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  join_url     text,
  notes        text,
  created_by   uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists sittings_circle_idx on public.sittings (circle_id, scheduled_at);

-- A sitting was briefly made to carry practice visits too. It is a video
-- sitting again; visits have their own table.
drop index if exists public.sittings_circle_kind_idx;
alter table public.sittings drop column if exists kind;
alter table public.sittings drop column if exists host_id;
alter table public.sittings drop column if exists location;

-- -----------------------------------------------------------------------------
-- goal_blocks — twelve-week blocks; commitments hang off them by week.
-- -----------------------------------------------------------------------------
create table if not exists public.goal_blocks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  description text,
  start_date  date not null,
  end_date    date not null,
  status      text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  template_id text,                                    -- the catalogue entry it began from, if any
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (end_date > start_date)
);
create index if not exists goal_blocks_user_idx on public.goal_blocks (user_id, status, start_date desc);

create table if not exists public.commitments (
  id           uuid primary key default gen_random_uuid(),
  block_id     uuid not null references public.goal_blocks (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  week         int not null check (week between 1 and 12),
  body         text not null,                          -- Commitment.text in the app
  status       text not null default 'open' check (status in ('open', 'done', 'partial', 'missed', 'carried')),
  carried_from uuid references public.commitments (id) on delete set null,
  sitting_id   uuid references public.sittings (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists commitments_block_week_idx on public.commitments (block_id, week);
create index if not exists commitments_user_idx on public.commitments (user_id);

-- -----------------------------------------------------------------------------
-- visits — a morning inside another principal's practice, and in turn one
-- inside yours. Either party may propose; the other agrees or declines, and may
-- decline for any reason without giving one. Both give the confidentiality
-- undertaking (visitor_agreed_at, host_agreed_at) before it is agreed.
-- visit_notes reference commitments, so both tables come after them.
-- -----------------------------------------------------------------------------
create table if not exists public.visits (
  id                uuid primary key default gen_random_uuid(),
  circle_id         uuid not null references public.circles (id) on delete cascade,
  -- The principal going, and the principal opening their practice.
  visitor_id        uuid not null references public.profiles (id) on delete cascade,
  host_id           uuid not null references public.profiles (id) on delete cascade,
  proposed_by_id    uuid not null references public.profiles (id) on delete cascade,
  scheduled_at      timestamptz not null,
  status            text not null default 'proposed'
                      check (status in ('proposed', 'agreed', 'declined', 'held', 'cancelled')),
  practice_name     text,                              -- the host's practice, for display
  proposal_note     text,                              -- what the visitor hopes to see
  arrival_note      text,                              -- where to park, who to ask for
  visitor_agreed_at timestamptz,
  host_agreed_at    timestamptz,
  held_at           timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (visitor_id <> host_id)
);
create index if not exists visits_circle_idx on public.visits (circle_id, scheduled_at);
create index if not exists visits_visitor_idx on public.visits (visitor_id, status);
create index if not exists visits_host_idx on public.visits (host_id, status);
-- One live morning at a time for a pair in a given direction; a practice may be
-- visited again once the last one is held, declined or cancelled.
create unique index if not exists visits_live_pair_idx
  on public.visits (circle_id, visitor_id, host_id)
  where status in ('proposed', 'agreed');

-- -----------------------------------------------------------------------------
-- visit_notes — the record of a visit, kept in four parts rather than one box
-- of prose. Three belong to the visitor (observation, takeaway, for_host) and
-- one to the host (host_note), because both sides learn something. A takeaway
-- that has been set down as a commitment carries its id.
-- -----------------------------------------------------------------------------
create table if not exists public.visit_notes (
  id            uuid primary key default gen_random_uuid(),
  visit_id      uuid not null references public.visits (id) on delete cascade,
  author_id     uuid not null references public.profiles (id) on delete cascade,
  kind          text not null check (kind in ('observation', 'takeaway', 'for_host', 'host_note')),
  body          text not null,
  commitment_id uuid references public.commitments (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists visit_notes_visit_idx on public.visit_notes (visit_id, created_at);

-- -----------------------------------------------------------------------------
-- check_ins — one per member per ISO week ("2026-W36").
-- -----------------------------------------------------------------------------
create table if not exists public.check_ins (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  circle_id      uuid references public.circles (id) on delete set null,
  week_key       text not null check (week_key ~ '^\d{4}-W\d{2}$'),
  block_week     int check (block_week is null or block_week between 1 and 12),
  did_well       text,
  struggled_with text,
  next_focus     text,
  energy         int check (energy is null or energy between 1 and 10),
  completed_at   timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, week_key)
);
create index if not exists check_ins_user_idx on public.check_ins (user_id, completed_at desc);
create index if not exists check_ins_circle_idx on public.check_ins (circle_id, completed_at desc);

-- -----------------------------------------------------------------------------
-- wins — the permanent win log. Archived rather than deleted.
-- -----------------------------------------------------------------------------
create table if not exists public.wins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  block_id    uuid references public.goal_blocks (id) on delete set null,
  title       text not null,
  detail      text,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists wins_user_idx on public.wins (user_id, created_at desc) where archived_at is null;

-- -----------------------------------------------------------------------------
-- messages — a circle's thread. read_at is set by the reader, not the sender.
-- -----------------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  circle_id  uuid not null references public.circles (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists messages_circle_idx on public.messages (circle_id, created_at);

-- -----------------------------------------------------------------------------
-- notes — a mentor's note about a mentee: on a commitment, a check-in, or general.
-- -----------------------------------------------------------------------------
create table if not exists public.notes (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.profiles (id) on delete cascade,
  about_user_id uuid not null references public.profiles (id) on delete cascade,
  commitment_id uuid references public.commitments (id) on delete set null,
  check_in_id   uuid references public.check_ins (id) on delete set null,
  body          text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists notes_about_idx on public.notes (about_user_id, created_at desc);
create index if not exists notes_author_idx on public.notes (author_id, created_at desc);

-- -----------------------------------------------------------------------------
-- benchmark_entries — monthly practice figures. Raw rows are own-only; the
-- cohort aggregates are exposed only through benchmark_cohort_stats() (0003).
-- -----------------------------------------------------------------------------
create table if not exists public.benchmark_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  period     date not null,                            -- first of the month
  metric_key text not null,                            -- see lib/benchmarks.ts
  value      numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period, metric_key)
);
create index if not exists benchmark_entries_metric_period_idx on public.benchmark_entries (metric_key, period);

-- -----------------------------------------------------------------------------
-- challenges — club-wide sprints with an opt-in leaderboard.
-- -----------------------------------------------------------------------------
create table if not exists public.challenges (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  metric_label text not null,                          -- e.g. 'new patients'
  start_date   date not null,
  end_date     date not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists challenges_start_idx on public.challenges (start_date desc);

create table if not exists public.challenge_participants (
  challenge_id       uuid not null references public.challenges (id) on delete cascade,
  user_id            uuid not null references public.profiles (id) on delete cascade,
  progress           numeric not null default 0 check (progress >= 0),
  leaderboard_opt_in boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  primary key (challenge_id, user_id)
);
create index if not exists challenge_participants_user_idx on public.challenge_participants (user_id);

-- -----------------------------------------------------------------------------
-- templates — the goal-block catalogue. Ids are stable text keys so the demo
-- world and the real records agree ("t-turnover"). Seeded in 0004.
-- -----------------------------------------------------------------------------
create table if not exists public.templates (
  id          text primary key,
  slug        text not null unique,
  title       text not null,
  description text,
  audience    text not null default 'any' check (audience in ('mentee', 'any')),
  sort        int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.template_weeks (
  id          uuid primary key default gen_random_uuid(),
  template_id text not null references public.templates (id) on delete cascade,
  week        int not null check (week between 1 and 12),
  body        text not null,                           -- weeks[].text in the app
  sort        int not null default 0
);
create index if not exists template_weeks_template_idx on public.template_weeks (template_id, week, sort);

-- =============================================================================
-- Triggers: updated_at, new-user provisioning
-- =============================================================================
create or replace function public.set_updated_at()
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
  foreach t in array array[
    'profiles', 'circles', 'sittings', 'visits', 'visit_notes', 'goal_blocks',
    'commitments', 'check_ins', 'wins', 'messages', 'notes', 'benchmark_entries',
    'challenges', 'challenge_participants', 'templates'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end$$;

-- A profile for every new auth user. Name and email come from sign-up metadata;
-- everything else is filled in during onboarding.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- (A trigger function cannot be called through the API, so no revoke is needed;
-- the auth service must keep EXECUTE on it for the trigger to fire.)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Realtime — the circle thread, check-ins and commitments update live, and so
-- do visits and their notes: a proposal answered in one practice should appear
-- in the other without a reload.
-- Realtime still honours RLS, so members only ever see their own circles.
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array['messages', 'check_ins', 'commitments', 'visits', 'visit_notes'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end$$;
