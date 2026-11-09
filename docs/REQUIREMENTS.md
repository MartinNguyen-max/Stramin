# Stramin – Requirements

> **Status:** Draft v0.4 (2026-11-09)
> **Scope:** first release. See [VISION.md](VISION.md) for the why.

Each requirement has an ID (e.g. `ACC-1`), so the plan, code and tests can refer to it.
**Priority:** `Must` = required for the first release · `Should` = wanted, but the release can ship without it · `Future` = after the first release.

---

## 1. Accounts (ACC)

| ID | Requirement | Priority |
|---|---|---|
| ACC-1 | A user can sign up and log in with a Stramin account using **Google** or **email & password** (with email verification and password reset). See [ADR 0004](decisions/0004-authentication.md). | Must |
| ACC-2 | A user can log out. | Must |
| ACC-3 | A user stays logged in across visits until they log out. | Must |
| ACC-4 | A user can delete their account, which removes all their data (see PRIV-2). | Must |

## 2. Connections (CON)

| ID | Requirement | Priority |
|---|---|---|
| CON-1 | A user can connect their Strava account (OAuth). It only needs to be done once. | Must |
| CON-2 | A user can disconnect Strava. Stramin then revokes access and deletes the imported Strava data. | Must |
| CON-3 | On first connect, the full activity history is imported. The user sees import progress. | Must |
| CON-4 | New, edited and deleted Strava activities are synced automatically. | Must |
| CON-5 | A user can trigger a manual **Refresh**. | Must |
| CON-6 | The data model supports more than one provider per user, so Garmin can be added without a redesign. | Must |
| CON-7 | A user can connect Garmin. | Must |
| CON-8 | Strava data is never kept for more than 7 days without being re-fetched ([ADR 0009](decisions/0009-strava-rolling-cache.md)). | Must |
| CON-9 | **Duplicate detection:** when the same workout arrives from both Strava and Garmin, it is shown and counted **once**. Two activities match when sport, start time, duration and distance are close (within tolerances, not exactly equal). | Must |

## 3. Sports (SPT)

| ID | Requirement | Priority |
|---|---|---|
| SPT-1 | Every activity is mapped to one of: **Swim, Bike, Run, Strength, Other**. | Must |
| SPT-2 | Default mapping from Strava types (draft): Run/TrailRun/VirtualRun → Run · Ride/VirtualRide/GravelRide/MountainBikeRide → Bike · Swim → Swim · WeightTraining → Strength · everything else (incl. e-bike, CrossFit) → Other. | Must |
| SPT-3 | Run and Bike activities are marked **outdoor** or **indoor** (treadmill, trainer, virtual). | Must |
| SPT-4 | The user can choose to include **both** (default), **outdoor only** or **indoor only** for Run and Bike. The choice applies to stats and best efforts. | Must |

## 4. Home (HOME)

| ID | Requirement | Priority |
|---|---|---|
| HOME-1 | Shows total training hours **this week**, split by sport. | Must |
| HOME-2 | Shows the same for **last week** and earlier weeks, so weeks can be compared. | Must |
| HOME-3 | Shows **average weekly volume** per sport over a period the user picks (4 weeks, 3 months, 6 months, 1 year, all time). Distance for Swim/Bike/Run, hours for Strength. | Must |
| HOME-4 | Shows **event countdowns** (see EVT). Each one can be hidden from Home. | Must |

## 4b. Activities (ACT)

| ID | Requirement | Priority |
|---|---|---|
| ACT-1 | A list of all activities, **grouped by week** (newest first), with weekly totals per sport in each week header. | Must |
| ACT-2 | The list can be filtered by sport. | Should |
| ACT-3 | An activity detail page shows the key stats: sport, date, duration, distance, pace/speed, heart rate, power, elevation. | Must |
| ACT-4 | Every activity links to its original on Strava ("View on Strava", which Strava's brand guidelines require). | Must |

## 5. Best efforts (BE)

| ID | Requirement | Priority |
|---|---|---|
| BE-1 | A best effort is the **fastest segment** of a given distance inside any activity (e.g. the fastest 5 km inside a 12 km run). | Must |
| BE-2 | Distances: **Run** 5 km, 10 km, 21.1 km, 42.2 km · **Bike** 30, 60, 90, 120, 150, 180 km · **Swim** 400 m, 1 km, 1.5 km, 1.9 km, 3.8 km *(swim = placeholders)*. | Must |
| BE-3 | **Bike power:** best average watts over fixed durations (placeholders: 5 s, 1 min, 5 min, 20 min, 60 min). Only for activities with power data. | Must |
| BE-4 | Each best effort links to the activity it came from, with its date. | Should |
| BE-5 | Best efforts are recomputed when activities are added, edited or deleted. | Must |

## 6. Events (EVT)

An event is a date to count down to, e.g. "Ironman Copenhagen, 100 days".

| ID | Requirement | Priority |
|---|---|---|
| EVT-1 | A user can create, edit and delete events with a **name**, **date** and **type** (Run, Bike, Swim, Triathlon, Other). | Must |
| EVT-2 | A user can upload an image for an event. Otherwise a default image per type is used. | Must |
| EVT-3 | All upcoming events are shown as countdowns on Home, unless hidden (HOME-4). | Must |
| EVT-4 | Events can be managed both from Home (tap a card to edit, "+" to add) and from Settings. | Must |

## 7. Goals (GOAL)

A goal is a performance target, e.g. "5 km in 15:00". Goals have their own page.

| ID | Requirement | Priority |
|---|---|---|
| GOAL-1 | A user can create, edit and delete goals: a **sport**, **distance** and **target time** (or pace). | Must |
| GOAL-2 | A goal can optionally be linked to an event. | Should |
| GOAL-3 | The goal page shows the gap between the user's current best effort and the target. | Must |
| GOAL-4 | The goal page shows simple **feedback** on what to work on, e.g. *"Increase weekly running volume"*. The rules are written down in a doc before they are implemented. | Must |

## 8. Training library (TRN)

| ID | Requirement | Priority |
|---|---|---|
| TRN-1 | A list of ~10 predefined running workouts (written by the author). | Must |
| TRN-2 | A workout consists of steps (e.g. warm-up, intervals, recovery, cool-down). | Must |
| TRN-3 | Each step shows a **personal target pace**, calculated from the user's best efforts. The model is decided later. | Must |
| TRN-4 | If the user has no best efforts yet, the workout is shown without paces and with an explanation. | Must |

## 9. Settings (SET)

| ID | Requirement | Priority |
|---|---|---|
| SET-1 | **Units:** metric (default) or imperial. | Must |
| SET-2 | **Week start:** Monday (default) or Sunday. | Must |
| SET-3 | **Language:** English (default) or Danish. | Must |
| SET-4 | **Indoor/outdoor filter** for Run and Bike (SPT-4). | Must |
| SET-5 | Manage connections (connect/disconnect Strava). | Must |

## 10. Privacy (PRIV)

| ID | Requirement | Priority |
|---|---|---|
| PRIV-1 | A user can export all their data (e.g. JSON). | Must |
| PRIV-2 | Deleting the account permanently deletes all data and revokes Strava access. | Must |
| PRIV-3 | A user can only ever access their own data, which is enforced in the database. | Must |
| PRIV-4 | OAuth tokens are encrypted at rest and never sent to the browser. | Must |
| PRIV-5 | A simple privacy policy page. | Must |

## 11. Non-functional (NFR)

| ID | Requirement | Priority |
|---|---|---|
| NFR-1 | Installable as a PWA on iPhone and Android. | Must |
| NFR-2 | Mobile first. Also works on desktop. | Must |
| NFR-3 | Home loads fast: data is read from our database, never from Strava on page view. | Must |
| NFR-4 | Stays within Strava's API rate limits. | Must |
| NFR-5 | Follows Strava's API terms and brand guidelines (e.g. "Connect with Strava" button). | Must |
| NFR-6 | Runs on free tiers. | Must |
| NFR-7 | Accessible: readable contrast and works with screen readers. | Should |

---

## Open questions (can wait until implementation)

- [ ] Pace model for TRN-3 (e.g. VDOT / Riegel).
- [ ] Feedback rules for GOAL-4.
- [ ] Final swim distances and bike power durations.
