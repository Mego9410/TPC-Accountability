-- =============================================================================
-- The Principals Club — row level security
--
-- Every table is locked and opened deliberately. Three SECURITY DEFINER helpers
-- answer the questions the policies ask ("is the caller in this circle?",
-- "does the caller mentor this person?", "is the caller staff?") without the
-- policies recursing into the tables they protect. Each helper is stable,
-- pinned to the public schema, and executable only by signed-in members.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

-- Is the caller a current member of this circle?
create or replace function public.is_circle_member(p_circle uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.circle_members cm
    where cm.circle_id = p_circle
      and cm.user_id = auth.uid()
      and cm.left_at is null
  );
$$;

-- Does the caller mentor (or lead a pod containing) this person? True when the
-- caller is a mentor or lead in any active circle the target currently belongs to.
create or replace function public.is_mentor_of(p_target uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.circle_members me
    join public.circle_members them on them.circle_id = me.circle_id
    join public.circles c on c.id = me.circle_id
    where me.user_id = auth.uid()
      and me.role in ('mentor', 'lead')
      and me.left_at is null
      and them.user_id = p_target
      and them.left_at is null
      and c.status = 'active'
  );
$$;

-- Do the caller and this person currently share an active circle?
create or replace function public.shares_circle_with(p_target uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.circle_members me
    join public.circle_members them on them.circle_id = me.circle_id
    join public.circles c on c.id = me.circle_id
    where me.user_id = auth.uid()
      and me.left_at is null
      and them.user_id = p_target
      and them.left_at is null
      and c.status = 'active'
  );
$$;

-- Is the caller one of the two principals on this visit — the one going, or
-- the one opening their practice? Asked by the visit_notes policies, which must
-- reach into visits without the visits policies reaching back.
create or replace function public.is_visit_party(p_visit uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.visits v
    where v.id = p_visit
      and auth.uid() in (v.visitor_id, v.host_id)
  );
$$;

-- Is the caller a member of staff (the House)?
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff'
  );
$$;

-- Helpers answer only for signed-in members; never for the anonymous key.
revoke execute on function public.is_circle_member(uuid)   from public, anon;
revoke execute on function public.is_mentor_of(uuid)       from public, anon;
revoke execute on function public.shares_circle_with(uuid) from public, anon;
revoke execute on function public.is_visit_party(uuid)     from public, anon;
revoke execute on function public.is_staff()               from public, anon;
grant  execute on function public.is_circle_member(uuid)   to authenticated;
grant  execute on function public.is_mentor_of(uuid)       to authenticated;
grant  execute on function public.shares_circle_with(uuid) to authenticated;
grant  execute on function public.is_visit_party(uuid)     to authenticated;
grant  execute on function public.is_staff()               to authenticated;

-- -----------------------------------------------------------------------------
-- Lock everything
-- -----------------------------------------------------------------------------
alter table public.regions                enable row level security;
alter table public.profiles               enable row level security;
alter table public.circles                enable row level security;
alter table public.circle_members         enable row level security;
alter table public.sittings               enable row level security;
alter table public.visits                 enable row level security;
alter table public.visit_notes            enable row level security;
alter table public.goal_blocks            enable row level security;
alter table public.commitments            enable row level security;
alter table public.check_ins              enable row level security;
alter table public.wins                   enable row level security;
alter table public.messages               enable row level security;
alter table public.notes                  enable row level security;
alter table public.benchmark_entries      enable row level security;
alter table public.challenges             enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.templates              enable row level security;
alter table public.template_weeks         enable row level security;

-- -----------------------------------------------------------------------------
-- regions — a lookup; anyone signed in may read it.
-- -----------------------------------------------------------------------------
drop policy if exists regions_select on public.regions;
create policy regions_select on public.regions
  for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- profiles — the roll is readable by any member (circles, leaderboards and the
-- House all need names), you may edit only yourself, and staff may do anything.
-- Note: this means practice figures on the profile (region, chair count) are
-- visible club-wide; benchmark values themselves are never on the profile.
-- -----------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_staff on public.profiles;
create policy profiles_staff on public.profiles
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- -----------------------------------------------------------------------------
-- circles / circle_members — members read their own circles; the House
-- arranges them.
-- -----------------------------------------------------------------------------
drop policy if exists circles_select on public.circles;
create policy circles_select on public.circles
  for select to authenticated using (public.is_circle_member(id) or public.is_staff());

drop policy if exists circles_staff on public.circles;
create policy circles_staff on public.circles
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists circle_members_select on public.circle_members;
create policy circle_members_select on public.circle_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_circle_member(circle_id) or public.is_staff());

drop policy if exists circle_members_staff on public.circle_members;
create policy circle_members_staff on public.circle_members
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- -----------------------------------------------------------------------------
-- sittings — circle members read and arrange them; the person who arranged
-- one (or staff) may change it.
-- -----------------------------------------------------------------------------
drop policy if exists sittings_select on public.sittings;
create policy sittings_select on public.sittings
  for select to authenticated using (public.is_circle_member(circle_id) or public.is_staff());

drop policy if exists sittings_insert on public.sittings;
create policy sittings_insert on public.sittings
  for insert to authenticated
  with check (created_by = auth.uid() and (public.is_circle_member(circle_id) or public.is_staff()));

drop policy if exists sittings_update on public.sittings;
create policy sittings_update on public.sittings
  for update to authenticated
  using (created_by = auth.uid() or public.is_staff())
  with check (created_by = auth.uid() or public.is_staff());

drop policy if exists sittings_delete on public.sittings;
create policy sittings_delete on public.sittings
  for delete to authenticated using (created_by = auth.uid() or public.is_staff());

-- -----------------------------------------------------------------------------
-- visits — a morning in somebody's practice is between the two principals. The
-- pair see it, their mentor or pod lead sees it, and the House sees it; nobody
-- else in the circle does. Either party may propose one, and either may change
-- it afterwards: agreeing, declining, adding the arrival note, or marking it
-- held. Neither can delete it, so a declined morning stays on the record.
-- -----------------------------------------------------------------------------
drop policy if exists visits_select on public.visits;
create policy visits_select on public.visits
  for select to authenticated
  using (
    auth.uid() in (visitor_id, host_id)
    or public.is_mentor_of(visitor_id)
    or public.is_mentor_of(host_id)
    or public.is_staff()
  );

drop policy if exists visits_insert on public.visits;
create policy visits_insert on public.visits
  for insert to authenticated
  with check (
    proposed_by_id = auth.uid()
    and auth.uid() in (visitor_id, host_id)
    and public.is_circle_member(circle_id)
  );

drop policy if exists visits_update on public.visits;
create policy visits_update on public.visits
  for update to authenticated
  using (auth.uid() in (visitor_id, host_id) or public.is_staff())
  with check (auth.uid() in (visitor_id, host_id) or public.is_staff());

-- -----------------------------------------------------------------------------
-- visit_notes — what each side wrote down. Both parties read the whole record,
-- including what the visitor wrote for the host; that candour is the point of
-- the morning. Only the author may write, change or strike out their own note.
-- -----------------------------------------------------------------------------
drop policy if exists visit_notes_select on public.visit_notes;
create policy visit_notes_select on public.visit_notes
  for select to authenticated
  using (public.is_visit_party(visit_id) or public.is_staff());

drop policy if exists visit_notes_insert on public.visit_notes;
create policy visit_notes_insert on public.visit_notes
  for insert to authenticated
  with check (author_id = auth.uid() and public.is_visit_party(visit_id));

drop policy if exists visit_notes_update on public.visit_notes;
create policy visit_notes_update on public.visit_notes
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists visit_notes_delete on public.visit_notes;
create policy visit_notes_delete on public.visit_notes
  for delete to authenticated using (author_id = auth.uid());

-- -----------------------------------------------------------------------------
-- goal_blocks — yours to keep; your mentor may look.
-- -----------------------------------------------------------------------------
drop policy if exists goal_blocks_own on public.goal_blocks;
create policy goal_blocks_own on public.goal_blocks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists goal_blocks_mentor_select on public.goal_blocks;
create policy goal_blocks_mentor_select on public.goal_blocks
  for select to authenticated using (public.is_mentor_of(user_id) or public.is_staff());

-- -----------------------------------------------------------------------------
-- commitments — yours to keep; your mentor and your circle may look.
-- -----------------------------------------------------------------------------
drop policy if exists commitments_own on public.commitments;
create policy commitments_own on public.commitments
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists commitments_circle_select on public.commitments;
create policy commitments_circle_select on public.commitments
  for select to authenticated
  using (public.is_mentor_of(user_id) or public.shares_circle_with(user_id) or public.is_staff());

-- -----------------------------------------------------------------------------
-- check_ins — yours to write; your mentor and the circle you checked in with
-- may read. The insert guard stops a check-in being pinned to a circle you are
-- not in (which would otherwise leak it to that circle).
-- -----------------------------------------------------------------------------
drop policy if exists check_ins_select on public.check_ins;
create policy check_ins_select on public.check_ins
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_mentor_of(user_id)
    or (circle_id is not null and public.is_circle_member(circle_id))
    or public.is_staff()
  );

drop policy if exists check_ins_insert on public.check_ins;
create policy check_ins_insert on public.check_ins
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (circle_id is null or public.is_circle_member(circle_id))
  );

drop policy if exists check_ins_update on public.check_ins;
create policy check_ins_update on public.check_ins
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (circle_id is null or public.is_circle_member(circle_id))
  );

drop policy if exists check_ins_delete on public.check_ins;
create policy check_ins_delete on public.check_ins
  for delete to authenticated using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- wins — yours to keep; your mentor may look.
-- -----------------------------------------------------------------------------
drop policy if exists wins_own on public.wins;
create policy wins_own on public.wins
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists wins_mentor_select on public.wins;
create policy wins_mentor_select on public.wins
  for select to authenticated using (public.is_mentor_of(user_id) or public.is_staff());

-- -----------------------------------------------------------------------------
-- messages — the circle reads and writes its own thread, as themselves.
--
-- The only edit the app makes to a message is the reader marking it read, so
-- UPDATE is narrowed at the column level to read_at alone: nobody, sender
-- included, can rewrite a body after the fact. Circle members may set read_at
-- on messages they did not send.
-- -----------------------------------------------------------------------------
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated using (public.is_circle_member(circle_id));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.is_circle_member(circle_id));

drop policy if exists messages_mark_read on public.messages;
create policy messages_mark_read on public.messages
  for update to authenticated
  using (sender_id <> auth.uid() and public.is_circle_member(circle_id))
  with check (sender_id <> auth.uid() and public.is_circle_member(circle_id));

revoke update on public.messages from authenticated;
grant  update (read_at) on public.messages to authenticated;

-- -----------------------------------------------------------------------------
-- notes — the author keeps them; the person they are about may read them.
-- -----------------------------------------------------------------------------
drop policy if exists notes_author on public.notes;
create policy notes_author on public.notes
  for all to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists notes_about_select on public.notes;
create policy notes_about_select on public.notes
  for select to authenticated using (about_user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- benchmark_entries — strictly your own rows (your mentor may look). Cohort
-- figures come only from benchmark_cohort_stats() in 0003, never raw rows.
-- -----------------------------------------------------------------------------
drop policy if exists benchmark_entries_own on public.benchmark_entries;
create policy benchmark_entries_own on public.benchmark_entries
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists benchmark_entries_mentor_select on public.benchmark_entries;
create policy benchmark_entries_mentor_select on public.benchmark_entries
  for select to authenticated using (public.is_mentor_of(user_id));

-- -----------------------------------------------------------------------------
-- challenges — club-wide; the House sets them.
-- -----------------------------------------------------------------------------
drop policy if exists challenges_select on public.challenges;
create policy challenges_select on public.challenges
  for select to authenticated using (true);

drop policy if exists challenges_staff on public.challenges;
create policy challenges_staff on public.challenges
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- challenge_participants — you manage only your own participation. The
-- leaderboard is read through challenge_leaderboard() (0003), opted-in only.
drop policy if exists challenge_participants_own on public.challenge_participants;
create policy challenge_participants_own on public.challenge_participants
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- templates — a read-only catalogue for members; authored in SQL.
-- -----------------------------------------------------------------------------
drop policy if exists templates_select on public.templates;
create policy templates_select on public.templates
  for select to authenticated using (true);

drop policy if exists template_weeks_select on public.template_weeks;
create policy template_weeks_select on public.template_weeks
  for select to authenticated using (true);
