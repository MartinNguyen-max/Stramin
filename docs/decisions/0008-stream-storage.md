# 0008 – Store activity streams as compressed files

- **Status:** Accepted
- **Date:** 2026-11-09

## Context
*Streams* are the second-by-second data of an activity: time, distance, heart rate, power and altitude. A 1-hour activity has ~3,600 points per field. We need them to compute best efforts (BE), and again whenever we add a new distance or calculation.
Stored as rows or arrays in Postgres, one active user's history can take 100–200 MB. The free database is 500 MB.

## Options
- **Postgres** – simple to query, but fills the database fast and makes backups heavy.
- **Compressed files in object storage** – one gzipped file per activity. Typically ~10× smaller, and cheap. This is how most training apps store raw activity data.
- **Don't store streams** – compute best efforts on import, then discard. Smallest footprint, but any recalculation means re-fetching from Strava, which costs rate limit.

## Decision
- **Postgres** stores only summaries and computed results (`activities`, `activity_best_efforts`).
- **Streams** are stored as compressed files in **Supabase Storage** (private bucket, one file per activity, path `user_id/activity_id`).
- Storage access goes through a small interface in `src/lib/storage/`, so the provider can be swapped (e.g. to Cloudflare R2, which has 10 GB free) if we outgrow the free tier.

## Consequences
- The database stays small and fast.
- Best efforts can be recomputed without calling the provider. **Exception:** for Strava, only the streams of record-holding activities are kept ([ADR 0009](0009-strava-rolling-cache.md)).
- Deleting an activity or an account must also delete its stream files.
