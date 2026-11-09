# 0002 – Supabase as backend platform

- **Status:** Accepted
- **Date:** 2026-11-09

## Context
We need a database for users, activities and tokens, plus authentication, file storage (event images) and background jobs, all on a free tier and GDPR-friendly.

## Options
- **Supabase** – managed Postgres with Auth, Storage, Row Level Security, Queues and Cron. Free tier, EU region available.
- **Neon + separate auth (e.g. Better Auth)** – excellent serverless Postgres, but auth, storage and jobs must be assembled separately.
- **Convex** – modern reactive backend, but not SQL, which makes time-series aggregation and RLS-style isolation less natural.
- **Firebase** – NoSQL, a poor fit for aggregations like weekly volume.

## Decision
**Supabase**, hosted in an **EU region**. Production and development projects are kept separate.

## Consequences
- Postgres handles aggregations (weekly totals, averages) well.
- RLS gives database-level isolation per user (PRIV-3).
- Free tier limits apply: 500 MB database, and projects pause after inactivity. This must be watched (see the open question on stream storage).
