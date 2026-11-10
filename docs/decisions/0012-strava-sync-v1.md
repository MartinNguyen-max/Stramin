# 0012 – Strava sync v1: summaries, webhook + hourly job, no queue yet

- **Status:** Accepted (decided in work mode, to be reviewed by the owner). Narrows [ADR 0005](0005-background-sync.md) for now.
- **Date:** 2026-11-10

## Context
M3/M4 store the user's Strava connection and activities in our database, so pages never wait for Strava (NFR-3). ADR 0005 planned Supabase Queues + Cron for imports, webhooks and refreshes. With **activity summaries only** (streams come with M7), the work is small: a whole history is ~5 requests (200 activities per request), and a refresh is the same.

## Options
- **Supabase Queues + Cron (ADR 0005):** robust for thousands of jobs (streams, M7). More moving parts than summaries need today.
- **Vercel Cron:** only once a day on the free plan.
- **Do the work right after the trigger (`after()`), plus an hourly Supabase Cron job as a safety net:** the import runs right after connecting, webhooks are handled right after Strava calls us, and the hourly job refreshes data and catches anything missed. No queue table.

## Decision
The third option.

- **Connect (CON-1, CON-3):** the OAuth callback stores the encrypted tokens and starts the history import with `after()`. Home shows the import progress.
- **Webhook (CON-4):** `/api/strava/webhook` answers Strava at once and fetches/deletes the activity with `after()`. Deauthorizing on Strava deletes the connection and its activities.
- **Hourly job:** Supabase Cron (`pg_cron` + `pg_net`) calls `/api/jobs/run` with the secret from Supabase Vault (`cron_secret` = `CRON_SECRET` in Vercel). Per connection it:
  - finishes an import that didn't complete,
  - does a **full refresh** of all summaries when the last one is older than 24 hours (CON-8: everything is re-fetched well within 7 days; activities that disappeared on Strava are deleted),
  - otherwise a **quick sync** (the last few days) when the last sync is older than 3 hours,
  - deletes Strava activities not re-fetched for 7 days.
- **Refresh button (CON-5):** a quick sync on request.
- **Rate limits (NFR-4):** every Strava response's usage headers are checked; the job stops when 80 % of the 15-minute or daily limit is used and continues next hour.
- **Webhook verify token:** derived from the Strava client secret (a hash), so no extra secret is needed.

## Consequences
- Simple: no queue, all job code in the Next.js app, state in the `connections` table.
- Enough for the Strava athlete limit (10 users): about 30 requests per user per day.
- M7 (streams, one request per activity) will need the queue from ADR 0005.
