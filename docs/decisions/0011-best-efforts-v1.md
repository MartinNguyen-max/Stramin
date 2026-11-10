# 0011 – Best efforts v1: estimated from activity summaries, plus manual values

- **Status:** Accepted (decided in work mode, to be reviewed by the owner)
- **Date:** 2026-11-10

## Context
The Profile page shows best efforts (BE-1..7), and Goals and Training build on them. The exact method from the architecture (the fastest segment, computed from each activity's streams, M7) needs the sync engine (M4), stream storage (ADR 0008) and thousands of Strava requests for a first import. The owner wants best efforts now.

## Options
- **A. Streams (exact).** The fastest segment inside every activity. Exact, but needs M4 + M7 first and one request per activity.
- **B. Strava's own `best_efforts`** from the detailed activity (runs only). Exact for runs, but one request per run, and no bike or swim.
- **C. Estimate from activity summaries.** For each distance: the best average pace of any activity **at least as long as the distance** (from 98 % of it, scaled), times the distance. No extra requests: it uses the same activity list as Home.
- **Manual values** in any case: users know their race times, also from before Strava.

## Decision
**C now, A later (M7), plus manual values.**

- The estimate for distance `D` = `min(moving_time × D / distance)` over activities of that sport with `distance ≥ 0.98 × D`. It links to the activity it came from.
- It is **exact for races** of that distance and **on the safe (slower) side** otherwise: the fastest 5 km inside a 10 km is at least as fast as the 10 km's average pace.
- Indoor activities are included until the indoor/outdoor setting exists (SPT-4).
- **Manual values** are stored in a new table, `personal_bests` (user_id, sport, distance_m, seconds, achieved_on). A manual value wins over the estimate; "reset" deletes it.
- Only manual values are stored. Estimates are computed on the fly from the fetched activities, so no Strava data is stored (ADR 0009).

## Consequences
- Works today, with the temporary Strava connection.
- Estimates can be slower than the true best (e.g. a fast 5 km inside a long run). The page says "estimate" and lets the user correct it.
- M7 replaces the estimate with exact segments. Manual values stay.
