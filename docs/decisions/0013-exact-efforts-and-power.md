# 0013 – Exact run best efforts and bike power from a few detail requests

- **Status:** Accepted (decided in work mode, to be reviewed by the owner). Extends [ADR 0011](0011-best-efforts-v1.md).
- **Date:** 2026-11-10

## Context
The owner's feedback (P1–P3): the run best efforts were too fast, because the estimate used **moving time** (a 10-minute pause inside a 5 km didn't count). Strava gets them right. The owner also wants more bike distances and best 20-minute power / FTP.

## Options
- **Streams for every activity (M7):** exact for everything, but one request per activity and a queue.
- **Strava's detailed activity for a few runs, and the power stream for a few rides:** Strava's detailed run includes its own `best_efforts` (elapsed time, like Strava shows). Records are almost always inside the runs with the best average pace, and the best power inside the rides with the highest (weighted) average power.

## Decision
The second option.
- **Runs:** estimates now use **elapsed time** (pauses count). For the 3 runs with the best average pace per distance (1 km … marathon), Strava's own best efforts are fetched and stored in `activities.best_efforts`. An exact value wins over an estimate. Detailed runs from the webhook keep their best efforts for free.
- **Rides:** for the 6 rides with a power meter and the highest (weighted) average power, the power stream is fetched; the best 1, 5, 20 and 60 minutes are computed and stored in `activities.power_bests`. **FTP ≈ 95 % of the best 20 minutes.**
- **Bike distances:** 20, 40, 90, **100, 120**, 180 km (moving time).
- **Swims and rides** keep moving time (rests between sets and stops at lights aren't part of the effort).
- At most 10 detail requests per connection per hour (and 15 right after connecting), within the rate limits. Details are re-fetched after 6 days and cleared after 7 (ADR 0009).

## Consequences
- Run records match Strava for the runs that matter; the UI shows "Strava" (exact) or "Estimate".
- A record hidden in a slow run isn't found until M7 (streams for everything). Manual values still win.
- Power needs a power meter (`device_watts`); rides without one show nothing.
