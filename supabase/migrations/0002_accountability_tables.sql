-- =============================================================================
-- The Principals Club — Accountability features (the retention spine)
-- Step 1.1 (tables). Additive migration: extends the existing schema with the
-- pods / goal-blocks / check-ins / wins / benchmark / challenges model from the
-- master doc §4.1. The existing pairs/partnership tables are left untouched.
--
-- NOTE: `public.profiles` already exists (0001), so it is ALTERED here rather
-- than re-created. New benchmark-cohorting and gating columns are added.
-- =============================================================================

-- pgcrypto (gen_random_uuid) is already created in 0001; this is a safety net.
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- profiles — add accountability/benchmark/gating columns (additive)
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists region            text,                 -- benchmark cohorting
  add column if not exists practice_type     text,                 -- 'NHS','Private','Mixed'
  add column if not exists chair_count       int,
  add column if not exists is_paid_member    boolean not null default false,
  add column if not exists reliability_score numeric not null default 0;

-- -----------------------------------------------------------------------------
-- pods — groups of 4–6 members (network lock-in)
-- -----------------------------------------------------------------------------
create table if not exists public.pods (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  cohort_label text,                                   -- e.g. '2026 Q3'
  status       text not null default 'active' check (status in ('active', 'archived')),
  created_at   timestamptz not null default now()
);

create table if not exists public.pod_members (
  pod_id    uuid not null references public.pods (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null default 'member' check (role in ('member', 'lead')),
  joined_at timestamptz not null default now(),
  left_at   timestamptz,
  primary key (pod_id, user_id)
);
create index if not exists pod_members_user_idx on public.pod_members (user_id);

-- -----------------------------------------------------------------------------
-- goal_blocks — 12-week goal blocks
-- -----------------------------------------------------------------------------
create table if not exists public.goal_blocks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  description text,
  start_date  date not null,
  end_date    date not null,                           -- start + 12 weeks
  status      text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at  timestamptz not null default now()
);
create index if not exists goal_blocks_user_idx on public.goal_blocks (user_id);

-- -----------------------------------------------------------------------------
-- commitments — weekly commitments under a block
-- -----------------------------------------------------------------------------
create table if not exists public.commitments (
  id            uuid primary key default gen_random_uuid(),
  goal_block_id uuid not null references public.goal_blocks (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  week_number   int not null check (week_number between 1 and 12),
  text          text not null,
  status        text not null default 'open' check (status in ('open', 'done', 'partial', 'missed', 'carried')),
  carried_from  uuid references public.commitments (id),   -- roll-forward link
  created_at    timestamptz not null default now()
);
create index if not exists commitments_block_idx on public.commitments (goal_block_id);
create index if not exists commitments_user_idx on public.commitments (user_id);

-- -----------------------------------------------------------------------------
-- check_ins — weekly structured check-ins
-- -----------------------------------------------------------------------------
create table if not exists public.check_ins (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  pod_id           uuid references public.pods (id) on delete set null,
  week_number      int,
  did_well         text,
  struggled_with   text,
  next_week_focus  text,
  energy_score     int check (energy_score between 1 and 10),  -- 1..10 self-report
  completed_at     timestamptz not null default now()
);
create index if not exists check_ins_user_idx on public.check_ins (user_id);
create index if not exists check_ins_pod_idx on public.check_ins (pod_id);

-- -----------------------------------------------------------------------------
-- wins — permanent win log (data gravity)
-- -----------------------------------------------------------------------------
create table if not exists public.wins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  goal_block_id uuid references public.goal_blocks (id) on delete set null,
  title         text not null,
  detail        text,
  created_at    timestamptz not null default now()
);
create index if not exists wins_user_idx on public.wins (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- benchmark_entries — anonymised practice KPIs (the moat)
-- -----------------------------------------------------------------------------
create table if not exists public.benchmark_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  period       date not null,                          -- month being reported
  metric_key   text not null,                          -- 'monthly_turnover','hygiene_pct', etc.
  metric_value numeric not null,
  created_at   timestamptz not null default now(),
  unique (user_id, period, metric_key)
);
create index if not exists benchmark_entries_metric_period_idx
  on public.benchmark_entries (metric_key, period);

-- -----------------------------------------------------------------------------
-- challenges — club-wide challenges / sprints
-- -----------------------------------------------------------------------------
create table if not exists public.challenges (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  start_date  date not null,
  end_date    date not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.challenge_participants (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  progress     numeric not null default 0,
  primary key (challenge_id, user_id)
);
create index if not exists challenge_participants_user_idx
  on public.challenge_participants (user_id);
