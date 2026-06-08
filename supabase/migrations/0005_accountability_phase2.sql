-- =============================================================================
-- The Principals Club — Accountability Phase 2
--   * wins.archived_at        — archive/hide instead of destructive delete (2.5)
--   * profiles.checkin_nudge_opt_out — respect opt-out for the weekly nudge (2.7)
--   * reliability recompute    — consistency score engine (2.6)
--   * pg_cron nightly recompute (2.6)
-- Additive and idempotent.
-- =============================================================================

alter table public.wins
  add column if not exists archived_at timestamptz;

alter table public.profiles
  add column if not exists checkin_nudge_opt_out boolean not null default false;

-- -----------------------------------------------------------------------------
-- recompute_reliability(user) — mirrors lib/accountability.ts consistencyScore:
--   score = 100 * (elapsed weeks with a check-in / elapsed weeks)
--               * (commitments done / commitments counted)
-- Scoped to the member's most recent active 12-week block; falls back to a
-- check-in-only score when no active block exists.
-- -----------------------------------------------------------------------------
create or replace function public.recompute_reliability(p_user uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_block        public.goal_blocks%rowtype;
  v_elapsed      int;
  v_weeks_hit    int;
  v_done         int;
  v_counted      int;
  v_checkin_rate numeric;
  v_commit_rate  numeric;
  v_score        numeric;
begin
  select * into v_block
  from public.goal_blocks
  where user_id = p_user and status = 'active'
  order by start_date desc
  limit 1;

  if found then
    v_elapsed := greatest(1, least(12,
      floor(extract(epoch from (now() - v_block.start_date::timestamptz)) / (7 * 86400))::int + 1));

    select count(distinct date_trunc('week', completed_at)) into v_weeks_hit
    from public.check_ins
    where user_id = p_user
      and completed_at >= v_block.start_date::timestamptz;

    select count(*) filter (where status = 'done'),
           count(*) filter (where status <> 'carried')
      into v_done, v_counted
    from public.commitments
    where user_id = p_user and goal_block_id = v_block.id;
  else
    select count(distinct date_trunc('week', completed_at)) into v_elapsed
    from public.check_ins where user_id = p_user;
    v_weeks_hit := v_elapsed;
    v_done := 0;
    v_counted := 0;
  end if;

  if coalesce(v_elapsed, 0) <= 0 then
    v_score := 0;
  else
    v_checkin_rate := least(v_weeks_hit, v_elapsed)::numeric / v_elapsed;
    v_commit_rate  := case when v_counted > 0 then v_done::numeric / v_counted else 1 end;
    v_score := round(100 * v_checkin_rate * v_commit_rate);
  end if;

  update public.profiles set reliability_score = v_score where id = p_user;
  return v_score;
end;
$$;

-- Recompute for all paid members (called by the nightly cron job).
create or replace function public.recompute_all_reliability()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r record;
begin
  for r in select id from public.profiles where is_paid_member loop
    perform public.recompute_reliability(r.id);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Nightly recompute via pg_cron (02:30 UTC). pg_cron calls the SQL function
-- directly — no Edge Function needed for a pure in-database recompute.
-- Guarded so the migration is safe where pg_cron is unavailable (e.g. a bare
-- local Postgres); on Supabase the extension is allowlisted.
-- -----------------------------------------------------------------------------
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron unavailable (%): skipping nightly recompute schedule', sqlerrm;
    return;
  end;

  if exists (select 1 from cron.job where jobname = 'tpc-recompute-reliability') then
    perform cron.unschedule('tpc-recompute-reliability');
  end if;
  perform cron.schedule(
    'tpc-recompute-reliability',
    '30 2 * * *',
    $cron$select public.recompute_all_reliability();$cron$
  );
end$$;
