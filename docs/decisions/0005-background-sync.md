# 0005 – Supabase Queues + Cron for background sync

- **Status:** Accepted
- **Date:** 2026-11-09

## Context
Importing a full Strava history (often thousands of activities) and processing webhooks cannot happen within a single web request. Strava rate limits (per 15 min and per day, shared across all users) mean the work must be spread out and resumable.

## Options
- **Supabase Queues (pgmq) + Supabase Cron** – jobs stored in our own Postgres. A cron job calls a Next.js route every minute to process a batch. Nothing extra to set up.
- **Inngest / Trigger.dev** – dedicated job platforms with great retries, observability and dashboards. They add an external service and account.
- **Vercel Cron only** – too infrequent on the free plan, and there is no queue.

## Decision
**Supabase Queues** for jobs and **Supabase Cron** to trigger `/api/jobs/run` every minute (protected by a secret). The job code itself is TypeScript inside the Next.js app.

## Consequences
- All job code lives in one codebase and one language.
- Jobs must be small and idempotent (safe to run twice).
- The rate-limit handling is our own code (tracking Strava's usage headers).
- If the job load grows, we can move to Inngest/Trigger.dev without changing the job code much.
