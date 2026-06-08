-- =============================================================================
-- The Principals Club — Accountability features
-- Step 1.1 (RLS). Row Level Security for the new accountability tables only
-- (master doc §4.2). Existing tables (profiles, partnerships, …) keep the RLS
-- defined in 0001 and are NOT modified here.
--
-- DEVIATIONS FROM §4.2 (intentional, flagged):
--  * profiles policy: §4.2 proposes an own-only "for all" policy. We do NOT
--    apply it — 0001 already governs profiles (members may read the roll, edit
--    self), and the pod feed / member roll depend on reading podmates' names.
--    Adding an own-only policy here would break those reads.
--  * pods SELECT: §4.2 enables RLS on pods but defines no policy, which would
--    hide every pod from its own members. We add a members-can-read-their-pod
--    policy (needed by Step 3.1/3.2).
--  * challenges / challenge_participants: §4.2 enables RLS but defines no
--    policies. We add minimal sensible policies so the club-wide challenge
--    feature (Step 3.6) is usable; these will be refined in Phase 3.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: is the current user an active member of this pod?
-- SECURITY DEFINER avoids RLS recursion (mirrors is_partnership_member in 0001).
-- -----------------------------------------------------------------------------
create or replace function public.is_pod_member(p_pod uuid)
returns boolean
language sql
security definer
set search_path = public
stable as $$
  select exists (
    select 1 from public.pod_members
    where pod_id = p_pod and user_id = auth.uid() and left_at is null
  );
$$;

-- -----------------------------------------------------------------------------
-- Enable RLS on every new table
-- -----------------------------------------------------------------------------
alter table public.pods                   enable row level security;
alter table public.pod_members            enable row level security;
alter table public.goal_blocks            enable row level security;
alter table public.commitments            enable row level security;
alter table public.check_ins              enable row level security;
alter table public.wins                   enable row level security;
alter table public.benchmark_entries      enable row level security;
alter table public.challenges             enable row level security;
alter table public.challenge_participants enable row level security;

-- -----------------------------------------------------------------------------
-- pods — members may read pods they belong to (added; see deviations note)
-- Pod creation/assignment is done server-side (service role) per the doc.
-- -----------------------------------------------------------------------------
drop policy if exists pods_select on public.pods;
create policy pods_select on public.pods
  for select to authenticated using (public.is_pod_member(id));

-- -----------------------------------------------------------------------------
-- pod_members — read membership of pods you're in (or your own rows)
-- -----------------------------------------------------------------------------
drop policy if exists pod_members_select on public.pod_members;
create policy pod_members_select on public.pod_members
  for select to authenticated
  using (public.is_pod_member(pod_id) or user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- goal_blocks / commitments / wins — strictly own-only
-- -----------------------------------------------------------------------------
drop policy if exists goal_blocks_all on public.goal_blocks;
create policy goal_blocks_all on public.goal_blocks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists commitments_all on public.commitments;
create policy commitments_all on public.commitments
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists wins_all on public.wins;
create policy wins_all on public.wins
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- check_ins — own write; podmates can read (shared accountability surface)
-- -----------------------------------------------------------------------------
drop policy if exists check_ins_insert on public.check_ins;
create policy check_ins_insert on public.check_ins
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists check_ins_update on public.check_ins;
create policy check_ins_update on public.check_ins
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists check_ins_select on public.check_ins;
create policy check_ins_select on public.check_ins
  for select to authenticated
  using (user_id = auth.uid() or (pod_id is not null and public.is_pod_member(pod_id)));

-- -----------------------------------------------------------------------------
-- benchmark_entries — user reads/writes only their OWN rows.
-- Aggregates are exposed via benchmark_cohort_stats() (0004), never raw rows.
-- -----------------------------------------------------------------------------
drop policy if exists benchmark_entries_all on public.benchmark_entries;
create policy benchmark_entries_all on public.benchmark_entries
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- challenges — club-wide, readable by any authenticated member (added).
-- Creation is server-side (service role) per the doc.
-- -----------------------------------------------------------------------------
drop policy if exists challenges_select on public.challenges;
create policy challenges_select on public.challenges
  for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- challenge_participants — a member manages only their own participation (added).
-- Leaderboard visibility (opt-in) is handled at read time in Phase 3 (Step 3.6).
-- -----------------------------------------------------------------------------
drop policy if exists challenge_participants_all on public.challenge_participants;
create policy challenge_participants_all on public.challenge_participants
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
