# 0009 – Strava data as a rolling 7-day cache

- **Status:** Accepted
- **Date:** 2026-11-09

## Context
Strava's API Policy (6.2) allows Strava data to be cached for **at most 7 days** (see [research](../research/strava-api-terms.md)). Stramin needs a user's full history for weekly stats, averages (incl. "all time") and best efforts.

## Options
- **Store permanently** – simplest, but breaks the terms.
- **File import for history** – the user uploads exports. Rejected: too manual.
- **Rolling cache** – store Strava data, but re-fetch each activity before it is 7 days old. Data older than 7 days without a refresh is deleted.

## Decision
**Rolling cache.**
- Every Strava-sourced row (activities, streams, best efforts derived from them) has a `fetched_at` timestamp.
- A `refresh_expiring` job (see [ADR 0005](0005-background-sync.md)) re-fetches data before it turns 7 days old.
- A cleanup job deletes any Strava-sourced data older than 7 days that could not be refreshed.
- **Refresh cheaply:**
  - Summaries are re-fetched with the list endpoint (up to 200 activities per request).
  - Streams are re-fetched only for the activities that hold a user's **top 3** per best-effort distance/duration (~50 activities), not the whole history.
  - Other streams are deleted after their best efforts are computed.

**Assumption:** Policy 5.4 (no "analytics") targets analysis *across* users or for the developer's own purposes, **not** showing a user statistics about their own data. This is a known risk. If Strava interprets it differently, Garmin remains the main source.

## Consequences
- Complies with the 7-day rule.
- Rate limit use per user is about 60 requests/week once their history has been imported, so 2,000 reads/day supports a few hundred users.
- The **first import** is the expensive part (one stream request per activity), so it is throttled and may take hours or days for long histories.
- Beyond 10 users, Strava's review is still required.
- If refreshing fails (e.g. rate limit), data can briefly disappear. Garmin data is not affected (its terms still to be confirmed).
