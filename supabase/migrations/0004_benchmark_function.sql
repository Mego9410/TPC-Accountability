-- =============================================================================
-- The Principals Club — Accountability features
-- Step 1.1 (benchmark guard). Master doc §4.3.
--
-- The benchmark is the moat ONLY if it never leaks individuals. Aggregates are
-- exposed through this SECURITY DEFINER function, which returns NO rows for any
-- cohort smaller than 5 (the min-cohort guard). Raw benchmark_entries rows are
-- never exposed to other users (RLS in 0003 keeps them own-only).
-- =============================================================================

create or replace function public.benchmark_cohort_stats(
  p_metric        text,
  p_period        date,
  p_region        text default null,
  p_practice_type text default null
)
returns table (cohort_size int, median_value numeric, p25 numeric, p75 numeric)
language sql
security definer
set search_path = public
stable as $$
  with cohort as (
    select b.metric_value
    from public.benchmark_entries b
    join public.profiles pr on pr.id = b.user_id
    where b.metric_key = p_metric
      and b.period = p_period
      and (p_region is null or pr.region = p_region)
      and (p_practice_type is null or pr.practice_type = p_practice_type)
  )
  select count(*)::int,
         percentile_cont(0.5)  within group (order by metric_value),
         percentile_cont(0.25) within group (order by metric_value),
         percentile_cont(0.75) within group (order by metric_value)
  from cohort
  having count(*) >= 5;   -- min-cohort guard: returns no rows if fewer than 5
$$;
