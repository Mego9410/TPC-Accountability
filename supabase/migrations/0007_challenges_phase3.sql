-- =============================================================================
-- The Principals Club — Club challenges (master doc Step 3.6)
--
--   * leaderboard_opt_in — the leaderboard is strictly opt-in; opted-out
--     members are excluded entirely.
--   * challenge_leaderboard() — SECURITY DEFINER read that exposes ONLY the
--     display name + progress of opted-in participants, never raw rows.
-- =============================================================================

alter table public.challenge_participants
  add column if not exists leaderboard_opt_in boolean not null default false;

-- Opted-in participants only; display name + progress, ranked. Raw
-- challenge_participants rows stay own-only under RLS (0003).
create or replace function public.challenge_leaderboard(p_challenge uuid)
returns table (display_name text, progress numeric, rank int)
language sql
security definer
set search_path = public
stable as $$
  select coalesce(nullif(trim(pr.full_name), ''), 'A principal') as display_name,
         cp.progress,
         rank() over (order by cp.progress desc)::int as rank
  from public.challenge_participants cp
  join public.profiles pr on pr.id = cp.user_id
  where cp.challenge_id = p_challenge
    and cp.leaderboard_opt_in = true
  order by cp.progress desc;
$$;
