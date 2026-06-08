-- =============================================================================
-- Weekly check-in nudge schedule (master doc Step 2.7)
--
-- This is NOT run automatically by `supabase db push` because it depends on:
--   1. the `checkin-nudge` Edge Function being deployed, and
--   2. secrets being available to pg_cron via pg_net.
--
-- Run it manually in the SQL editor (or as a one-off migration) AFTER deploying
-- the function, substituting <PROJECT_REF> and <SERVICE_ROLE_KEY>. Storing the
-- key in Vault is preferred over inlining it; the inline form is shown for
-- clarity only.
-- =============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Monday 08:00 UTC, every week.
select cron.schedule(
  'tpc-checkin-nudge',
  '0 8 * * 1',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/checkin-nudge',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- To remove:  select cron.unschedule('tpc-checkin-nudge');
