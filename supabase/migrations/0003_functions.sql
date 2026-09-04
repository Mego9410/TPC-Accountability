-- =============================================================================
-- The Principals Club — functions
--
--   * benchmark_cohort_stats  — the benchmark, guarded so it never leaks a person
--   * challenge_leaderboard   — opted-in participants only
--   * recompute_consistency   — the consistency score, mirroring lib/weeks.ts
--   * recompute_all_consistency — the nightly sweep (pg_cron only)
--
-- Every function is SECURITY DEFINER with a pinned search_path, and each is
-- granted only to the roles that should be able to call it.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- benchmark_cohort_stats — median and quartiles for one metric and month,
-- optionally narrowed by region and practice type.
--
-- The benchmark is only worth having if it never identifies an individual, so
-- the function returns no rows at all for a cohort smaller than five. It is
-- bound to the caller: only Society members, mentors and staff may ask.
-- -----------------------------------------------------------------------------
create or replace function public.benchmark_cohort_stats(
  p_metric        text,
  p_period        date,
  p_region        text default null,
  p_practice_type text default null
)
returns table (cohort_size int, median numeric, p25 numeric, p75 numeric)
language sql
security definer
set search_path = public
stable
as $$
  with caller as (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and (me.tier = 'society' or me.role in ('mentor', 'staff'))
  ),
  cohort as (
    select b.value
    from public.benchmark_entries b
    join public.profiles pr on pr.id = b.user_id
    where exists (select 1 from caller)
      and b.metric_key = p_metric
      and b.period = p_period
      and (p_region is null or pr.region = p_region)
      and (p_practice_type is null or pr.practice_type = p_practice_type)
  )
  select count(*)::int,
         percentile_cont(0.5)  within group (order by value),
         percentile_cont(0.25) within group (order by value),
         percentile_cont(0.75) within group (order by value)
  from cohort
  having count(*) >= 5;   -- the min-cohort guard: no rows below five
$$;

revoke execute on function public.benchmark_cohort_stats(text, date, text, text) from public, anon;
grant  execute on function public.benchmark_cohort_stats(text, date, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- challenge_leaderboard — display name and progress of opted-in participants,
-- ranked. Raw participation rows stay own-only under RLS.
-- -----------------------------------------------------------------------------
create or replace function public.challenge_leaderboard(p_challenge uuid)
returns table (user_id uuid, display_name text, progress numeric, rank int)
language sql
security definer
set search_path = public
stable
as $$
  select cp.user_id,
         coalesce(nullif(trim(pr.full_name), ''), 'A member') as display_name,
         cp.progress,
         rank() over (order by cp.progress desc)::int as rank
  from public.challenge_participants cp
  join public.profiles pr on pr.id = cp.user_id
  where auth.uid() is not null
    and cp.challenge_id = p_challenge
    and cp.leaderboard_opt_in
  order by cp.progress desc, pr.full_name;
$$;

revoke execute on function public.challenge_leaderboard(uuid) from public, anon;
grant  execute on function public.challenge_leaderboard(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- recompute_consistency — mirrors consistencyScore() in lib/weeks.ts:
--
--   check-in rate   = weeks with a check-in / weeks elapsed in the active block
--   commitment rate = (kept − ½·partly kept) / commitments counted
--   score           = round(100 × (½ check-in rate + ½ commitment rate))
--
-- Scoped to the member's most recent active block. With no active block the
-- elapsed weeks are simply the weeks they have checked in, and with nothing
-- to count the commitment rate is 1, as in the app. Callable by the member
-- themself or by staff.
-- -----------------------------------------------------------------------------
create or replace function public.recompute_consistency(p_user uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_block        public.goal_blocks%rowtype;
  v_elapsed      int;
  v_weeks_hit    int;
  v_kept         numeric;
  v_partial      int;
  v_counted      int;
  v_checkin_rate numeric;
  v_commit_rate  numeric;
  v_score        numeric;
begin
  -- The member themself, staff, the service key, or a direct database session
  -- (the scheduler) — nobody else. auth.role() is null outside an API request.
  if auth.uid() is distinct from p_user
     and not public.is_staff()
     and coalesce(auth.role(), 'service_role') <> 'service_role' then
    raise exception 'recompute_consistency: not permitted' using errcode = '42501';
  end if;

  select * into v_block
  from public.goal_blocks
  where user_id = p_user and status = 'active'
  order by start_date desc
  limit 1;

  if found then
    -- Calendar weeks since the block began (Monday-based), clamped to 1..12.
    v_elapsed := greatest(1, least(12,
      (extract(day from date_trunc('week', now()) - date_trunc('week', v_block.start_date::timestamptz)) / 7)::int + 1));

    select count(distinct ci.week_key) into v_weeks_hit
    from public.check_ins ci
    where ci.user_id = p_user
      and ci.completed_at >= v_block.start_date::timestamptz;

    select count(*) filter (where status in ('done', 'partial')),
           count(*) filter (where status = 'partial'),
           count(*) filter (where status <> 'carried')
      into v_kept, v_partial, v_counted
    from public.commitments
    where user_id = p_user and block_id = v_block.id;
  else
    select count(distinct ci.week_key) into v_elapsed
    from public.check_ins ci
    where ci.user_id = p_user;
    v_weeks_hit := v_elapsed;
    v_kept := 0;
    v_partial := 0;
    v_counted := 0;
  end if;

  if coalesce(v_elapsed, 0) <= 0 then
    v_score := 0;
  else
    v_checkin_rate := least(v_weeks_hit, v_elapsed)::numeric / v_elapsed;
    v_commit_rate  := case when v_counted > 0
                        then (v_kept - v_partial * 0.5) / v_counted
                        else 1 end;
    v_score := round(100 * (0.5 * v_checkin_rate + 0.5 * v_commit_rate));
  end if;

  update public.profiles set consistency_score = v_score where id = p_user;
  return v_score;
end;
$$;

revoke execute on function public.recompute_consistency(uuid) from public, anon;
grant  execute on function public.recompute_consistency(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- recompute_all_consistency — the nightly sweep over every member. Not
-- callable through the API by anyone; only the scheduler runs it.
-- -----------------------------------------------------------------------------
create or replace function public.recompute_all_consistency()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r record;
begin
  for r in select id from public.profiles where role <> 'staff' loop
    perform public.recompute_consistency(r.id);
  end loop;
end;
$$;

revoke execute on function public.recompute_all_consistency() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Nightly recompute at 02:30 UTC via pg_cron, which calls the SQL function
-- directly. Guarded so the migration is safe where pg_cron is unavailable
-- (a bare local Postgres); on Supabase the extension is allowlisted.
-- -----------------------------------------------------------------------------
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron unavailable (%): skipping nightly consistency schedule', sqlerrm;
  end;

  if not exists (select 1 from pg_namespace where nspname = 'cron') then
    return;
  end if;

  if exists (select 1 from cron.job where jobname = 'tpc-recompute-consistency') then
    perform cron.unschedule('tpc-recompute-consistency');
  end if;
  perform cron.schedule(
    'tpc-recompute-consistency',
    '30 2 * * *',
    $cron$select public.recompute_all_consistency();$cron$
  );
end$$;
