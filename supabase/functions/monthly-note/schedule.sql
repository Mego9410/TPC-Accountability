-- =============================================================================
-- The monthly note — schedule
--
-- This is NOT run automatically by `supabase db push` because it depends on:
--   1. the `monthly-note` Edge Function being deployed, and
--   2. secrets being available to pg_cron via pg_net.
--
-- Run it manually in the SQL editor (or as a one-off migration) AFTER deploying
-- the function, substituting <PROJECT_REF> and <SERVICE_ROLE_KEY>. Storing the
-- key in Vault is preferred over inlining it; the inline form is shown for
-- clarity only.
-- =============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- The first of the month, 08:00 UTC. Once a month and no more: the note is
-- worth reading only because it is rare.
select cron.schedule(
  'tpc-monthly-note',
  '0 8 1 * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/monthly-note',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- The old weekly check-in nudge, if it is still scheduled:
--   select cron.unschedule('tpc-checkin-nudge');
-- To remove this one:
--   select cron.unschedule('tpc-monthly-note');
