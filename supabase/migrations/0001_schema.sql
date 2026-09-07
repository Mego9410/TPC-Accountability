-- =============================================================================
-- The Principals Club — schema
--
-- Two things, and nothing else (see lib/domain.ts).
--
--   1. A **partner**. One principal asks another; if they agree, the two of
--      them share what they are working on and each keeps an eye on whether
--      the other is getting on with it. One ongoing relationship, held in
--      `partnerships`, with the work itself in `goals` and `goal_updates`.
--
--   2. A **companion visit**. A morning inside another principal's practice,
--      and in turn a morning inside yours. Held in `visits`.
--
-- `messages` carries the correspondence between any two members; `profiles` is
-- the directory every member may read.
--
-- Column names are snake_case; the app maps them to camelCase at the door
-- (lib/repo/supabase/mappers.ts). Row level security lives in 0002.
-- =============================================================================

create extension if not exists "pgcrypto";

-- Membership numbers echo the Club's "No. 0148" convention: the first real
-- member is 0149.
create sequence if not exists public.membership_seq start with 149;

-- -----------------------------------------------------------------------------
-- regions — the twelve UK regions. Mirrors REGIONS in lib/regions.ts; keep the
-- two lists in step.
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
-- profiles — one row per auth user, created by trigger on sign-up. This is the
-- directory: every signed-in member may read every row (0002), because finding
-- a partner or a practice worth a morning is the whole point.
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
  -- A short note on the practice, read by anyone deciding whether to ask you.
  bio                text,
  -- What you are working on. Shown when someone is looking for a partner.
  focus_areas        text[] not null default '{}',
  -- Willing to receive a visitor, and looking for a partner, at present.
  open_to_visits     boolean not null default true,
  open_to_partner    boolean not null default false,
  membership_no      text not null unique default lpad(nextval('public.membership_seq')::text, 4, '0'),
  role               text not null default 'member' check (role in ('member', 'staff')),
  onboarded          boolean not null default false,
  -- The monthly note asking how the goals are getting on.
  nudge_opt_out      boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- The directory listing: everyone but the House, in name order.
create index if not exists profiles_role_name_idx on public.profiles (role, full_name);
-- Narrowing the directory by where and what kind of practice.
create index if not exists profiles_region_type_idx on public.profiles (region, practice_type);
-- The two "who is available" filters.
create index if not exists profiles_open_to_partner_idx on public.profiles (open_to_partner) where open_to_partner;
create index if not exists profiles_open_to_visits_idx on public.profiles (open_to_visits) where open_to_visits;

-- -----------------------------------------------------------------------------
-- partnerships — one ongoing relationship between two principals. Order carries
-- no meaning: a_id and b_id are simply the two of them. Either may propose; the
-- other agrees ('active') or declines ('declined'), and either may end it.
-- -----------------------------------------------------------------------------
create table if not exists public.partnerships (
  id             uuid primary key default gen_random_uuid(),
  a_id           uuid not null references public.profiles (id) on delete cascade,
  b_id           uuid not null references public.profiles (id) on delete cascade,
  proposed_by_id uuid not null references public.profiles (id) on delete cascade,
  status         text not null default 'proposed'
                   check (status in ('proposed', 'active', 'declined', 'ended')),
  -- A word with the request: why you asked.
  message        text,
  started_at     timestamptz,
  ended_at       timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (a_id <> b_id)
);

create index if not exists partnerships_a_idx on public.partnerships (a_id, created_at desc);
create index if not exists partnerships_b_idx on public.partnerships (b_id, created_at desc);
-- The question is_partner_of() asks, and the one the partner page asks.
create index if not exists partnerships_active_idx on public.partnerships (status) where status = 'active';

-- Two principals cannot have two live rows between them, whichever way round
-- they were entered. A declined or ended relationship leaves the pair free to
-- ask again.
create unique index if not exists partnerships_live_pair_idx
  on public.partnerships (least(a_id, b_id), greatest(a_id, b_id))
  where status in ('proposed', 'active');

-- -----------------------------------------------------------------------------
-- goals — what a principal is working on. No blocks, no weeks: a goal is open
-- until it is done. A goal without a target date is still a goal.
-- -----------------------------------------------------------------------------
create table if not exists public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  detail      text,
  target_date date,
  status      text not null default 'open' check (status in ('open', 'done')),
  done_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- listGoals(): open first, then by target date with the undated last.
create index if not exists goals_user_idx
  on public.goals (user_id, status desc, target_date asc nulls last);
-- The monthly note asks who has an open goal.
create index if not exists goals_open_idx on public.goals (user_id) where status = 'open';

-- -----------------------------------------------------------------------------
-- goal_updates — a line written against a goal: your own progress, or a word
-- from your partner. The monthly note asks for one of these.
-- -----------------------------------------------------------------------------
create table if not exists public.goal_updates (
  id         uuid primary key default gen_random_uuid(),
  goal_id    uuid not null references public.goals (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists goal_updates_goal_idx on public.goal_updates (goal_id, created_at);
create index if not exists goal_updates_author_idx on public.goal_updates (author_id, created_at desc);

-- -----------------------------------------------------------------------------
-- visits — a morning inside another principal's practice. Either party may
-- propose; the other agrees or declines, and may decline for any reason without
-- giving one. Nobody may delete one, so a declined morning stays on the record.
-- A visit is between any two members: it does not need a partnership.
-- -----------------------------------------------------------------------------
create table if not exists public.visits (
  id             uuid primary key default gen_random_uuid(),
  -- The principal going, and the principal opening their practice.
  visitor_id     uuid not null references public.profiles (id) on delete cascade,
  host_id        uuid not null references public.profiles (id) on delete cascade,
  proposed_by_id uuid not null references public.profiles (id) on delete cascade,
  scheduled_at   timestamptz not null,
  status         text not null default 'proposed'
                   check (status in ('proposed', 'agreed', 'declined', 'held', 'cancelled')),
  -- The host's practice, denormalised for display.
  practice_name  text,
  -- A word with the request: what you hope to see.
  proposal_note  text,
  -- The host's practicalities: where to park, who to ask for, when to arrive.
  arrival_note   text,
  -- Written afterwards by either of them, and seen by both.
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (visitor_id <> host_id)
);

create index if not exists visits_visitor_idx on public.visits (visitor_id, scheduled_at);
create index if not exists visits_host_idx on public.visits (host_id, scheduled_at);
create index if not exists visits_held_idx on public.visits (status, scheduled_at desc) where status = 'held';

-- One live morning at a time between any two principals, whichever of them is
-- the visitor. Once it is held, declined or cancelled they may arrange another.
create unique index if not exists visits_live_pair_idx
  on public.visits (least(visitor_id, host_id), greatest(visitor_id, host_id))
  where status in ('proposed', 'agreed');

-- -----------------------------------------------------------------------------
-- messages — correspondence between two members. read_at is set by the
-- recipient, never by the sender (0002 narrows UPDATE to that one column).
-- -----------------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  from_id    uuid not null references public.profiles (id) on delete cascade,
  to_id      uuid not null references public.profiles (id) on delete cascade,
  body       text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- listCorrespondents() and listMessagesWith() read from both sides.
create index if not exists messages_to_idx on public.messages (to_id, created_at);
create index if not exists messages_from_idx on public.messages (from_id, created_at);
create index if not exists messages_pair_idx on public.messages (from_id, to_id, created_at);
-- countUnread().
create index if not exists messages_unread_idx on public.messages (to_id) where read_at is null;

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

-- goal_updates and messages are written once and never edited (bar read_at, set
-- by column-level grant), so they carry no updated_at and no trigger.
do $$
declare t text;
begin
  foreach t in array array['profiles', 'partnerships', 'goals', 'visits'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end$$;

-- A profile for every new auth user. Name, honorific and email come from
-- sign-up metadata; everything else is filled in during onboarding.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, honorific, full_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'honorific', ''), 'Dr'),
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
-- Realtime — a message, a word against a goal, or an answer to a visit proposal
-- should appear in the other practice without a reload. Realtime still honours
-- RLS, so a member only ever sees rows the policies in 0002 allow them.
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array['messages', 'goal_updates', 'visits'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end$$;
