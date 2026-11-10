-- Logged-in users may READ activities; RLS limits it to their own rows. Only the server writes.
-- `connections` gets no grants at all: tokens never leave the server (PRIV-4).
GRANT SELECT ON TABLE public.activities TO authenticated;
--> statement-breakpoint

-- Hourly Strava sync (ADR 0012): Supabase Cron calls /api/jobs/run with the secret from Vault.
-- The secret `cron_secret` is created by hand in the dashboard (Integrations → Vault); it equals CRON_SECRET in Vercel.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
--> statement-breakpoint
SELECT cron.schedule(
  'stramin-strava-sync',
  '7 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://stramin.vercel.app/api/jobs/run',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
  $$
);
