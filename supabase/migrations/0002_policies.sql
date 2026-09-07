-- =============================================================================
-- The Principals Club — row level security
--
-- Every table is locked and opened deliberately. Two SECURITY DEFINER helpers
-- answer the questions the policies ask ("is the caller the House?", "is the
-- caller this person's partner?") without a policy recursing into the table it
-- protects. Each is stable, pinned to the public schema, and executable only by
-- signed-in members.
--
-- The shape of it:
--   * profiles      — a directory. Every member reads it; you edit only you.
--   * partnerships  — the two parties, and the House looking on.
--   * goals         — yours, plus your partner reading them.
--   * goal_updates  — written by you or your partner, against such a goal.
--   * visits        — the two principals, and the House looking on.
--   * messages      — sender and recipient, and read_at set only by the reader.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

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

-- Is the caller this person's partner — that is, does an **active**
-- partnership join the two of them? Proposed, declined and ended rows do not
-- count: until they agree, neither sees the other's work.
create or replace function public.is_partner_of(target uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.partnerships p
    where p.status = 'active'
      and (
        (p.a_id = auth.uid() and p.b_id = target) or
        (p.b_id = auth.uid() and p.a_id = target)
      )
  );
$$;

-- Helpers answer only for signed-in members; never for the anonymous key.
revoke execute on function public.is_staff()            from public, anon;
revoke execute on function public.is_partner_of(uuid)   from public, anon;
grant  execute on function public.is_staff()            to authenticated;
grant  execute on function public.is_partner_of(uuid)   to authenticated;

-- -----------------------------------------------------------------------------
-- Lock everything
-- -----------------------------------------------------------------------------
alter table public.regions      enable row level security;
alter table public.profiles     enable row level security;
alter table public.partnerships enable row level security;
alter table public.goals        enable row level security;
alter table public.goal_updates enable row level security;
alter table public.visits       enable row level security;
alter table public.messages     enable row level security;

-- -----------------------------------------------------------------------------
-- regions — a lookup; anyone signed in may read it, nobody may write it.
-- -----------------------------------------------------------------------------
drop policy if exists regions_select on public.regions;
create policy regions_select on public.regions
  for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- profiles — the directory. Any signed-in member may read any row: that is the
-- point of it, since you find your own partner and your own morning by reading
-- about other practices. You may change only your own row; the House may
-- change anyone's. Nobody inserts or deletes through the API — the trigger in
-- 0001 creates the row and the auth user's deletion cascades it away.
-- -----------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_update_staff on public.profiles;
create policy profiles_update_staff on public.profiles
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- -----------------------------------------------------------------------------
-- partnerships — between the two of them. Either may ask, either may answer,
-- and either may end it; the House looks on but does not arrange them. No
-- delete: a declined or ended relationship stays on the record.
-- -----------------------------------------------------------------------------
drop policy if exists partnerships_select on public.partnerships;
create policy partnerships_select on public.partnerships
  for select to authenticated
  using (auth.uid() in (a_id, b_id));

drop policy if exists partnerships_select_staff on public.partnerships;
create policy partnerships_select_staff on public.partnerships
  for select to authenticated using (public.is_staff());

drop policy if exists partnerships_insert on public.partnerships;
create policy partnerships_insert on public.partnerships
  for insert to authenticated
  with check (auth.uid() in (a_id, b_id) and proposed_by_id = auth.uid());

drop policy if exists partnerships_update on public.partnerships;
create policy partnerships_update on public.partnerships
  for update to authenticated
  using (auth.uid() in (a_id, b_id))
  with check (auth.uid() in (a_id, b_id));

-- -----------------------------------------------------------------------------
-- goals — yours to write, and your partner's to read. That asymmetry is the
-- arrangement: they keep an eye on whether you are getting on with it, they do
-- not keep the list for you. The House may read them.
-- -----------------------------------------------------------------------------
drop policy if exists goals_own on public.goals;
create policy goals_own on public.goals
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists goals_partner_select on public.goals;
create policy goals_partner_select on public.goals
  for select to authenticated
  using (public.is_partner_of(user_id) or public.is_staff());

-- -----------------------------------------------------------------------------
-- goal_updates — a line against a goal, written by its owner or by their
-- partner. You may read the ones on goals you can see; you may write only as
-- yourself; you may change or withdraw only your own words.
-- -----------------------------------------------------------------------------
drop policy if exists goal_updates_select on public.goal_updates;
create policy goal_updates_select on public.goal_updates
  for select to authenticated
  using (
    exists (
      select 1 from public.goals g
      where g.id = goal_updates.goal_id
        and (g.user_id = auth.uid() or public.is_partner_of(g.user_id) or public.is_staff())
    )
  );

drop policy if exists goal_updates_insert on public.goal_updates;
create policy goal_updates_insert on public.goal_updates
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.goals g
      where g.id = goal_updates.goal_id
        and (g.user_id = auth.uid() or public.is_partner_of(g.user_id))
    )
  );

drop policy if exists goal_updates_author_update on public.goal_updates;
create policy goal_updates_author_update on public.goal_updates
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists goal_updates_author_delete on public.goal_updates;
create policy goal_updates_author_delete on public.goal_updates
  for delete to authenticated using (author_id = auth.uid());

-- -----------------------------------------------------------------------------
-- visits — a morning in somebody's practice is between the two principals; the
-- House looks on. Either may propose one, and either may change it afterwards:
-- agreeing, declining, adding the arrival note, or marking it held. Neither can
-- delete it, so a declined morning stays on the record.
-- -----------------------------------------------------------------------------
drop policy if exists visits_select on public.visits;
create policy visits_select on public.visits
  for select to authenticated
  using (auth.uid() in (visitor_id, host_id));

drop policy if exists visits_select_staff on public.visits;
create policy visits_select_staff on public.visits
  for select to authenticated using (public.is_staff());

drop policy if exists visits_insert on public.visits;
create policy visits_insert on public.visits
  for insert to authenticated
  with check (auth.uid() in (visitor_id, host_id) and proposed_by_id = auth.uid());

drop policy if exists visits_update on public.visits;
create policy visits_update on public.visits
  for update to authenticated
  using (auth.uid() in (visitor_id, host_id))
  with check (auth.uid() in (visitor_id, host_id));

-- -----------------------------------------------------------------------------
-- messages — sender and recipient, and nobody else.
--
-- The only edit the app makes to a message is the recipient marking it read, so
-- UPDATE is narrowed at the column level to read_at alone: nobody, the sender
-- included, can rewrite a body after the fact.
-- -----------------------------------------------------------------------------
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated
  using (auth.uid() in (from_id, to_id));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (from_id = auth.uid());

drop policy if exists messages_mark_read on public.messages;
create policy messages_mark_read on public.messages
  for update to authenticated
  using (to_id = auth.uid())
  with check (to_id = auth.uid());

revoke update on public.messages from authenticated;
grant  update (read_at) on public.messages to authenticated;
