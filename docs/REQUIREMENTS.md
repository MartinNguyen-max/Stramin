# Stramin – Requirements

> **Status:** Draft v0.5 (2026-11-10)
> **Scope:** first release. See [VISION.md](VISION.md) for the why.

Each requirement has an ID (e.g. `ACC-1`), so the plan, code and tests can refer to it.
**Priority:** `Must` = required for the first release · `Should` = wanted, but the release can ship without it · `Future` = after the first release.

---

## 1. Accounts (ACC)

| ID | Requirement | Priority |
|---|---|---|
| ACC-1 | A user can sign up and log in with a Stramin account using **Google** or **email & password** (with email verification and password reset). See [ADR 0004](decisions/0004-authentication.md). | Must |
| ACC-2 | A user can log out. | Must |
| ACC-3 | A user stays logged in across visits until they log out (the login is kept for 400 days and renewed on every visit). When a saved login exists, **Log in** shows "Continue as {name}" and "Use another account" instead of logging in silently. | Must |
| ACC-5 | **Name:** at sign up the user answers "What should we call you?" (1–30 characters; letters from any language, plus space, `-`, `'` and `.`; must start with a letter; no digits, emojis or links). With Google, the first name is taken from the Google account. The name can be changed in Settings. Validated in the browser **and** on the server. | Must |
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
| CON-10 | **One-time history import:** a guide page that links to Garmin's (and Strava's) "export my data", and an upload where the user drops the whole export ZIP. Stramin finds and imports the activities. For users without Strava history. | Should |
| CON-9 | **Duplicate detection:** when the same workout arrives from both Strava and Garmin, it is shown and counted **once**. Two activities match when sport, start time, duration and distance are close (within tolerances, not exactly equal). | Must |

## 3. Sports (SPT)

| ID | Requirement | Priority |
|---|---|---|
| SPT-1 | Every activity is mapped to one of: **Swim, Bike, Run, Strength, Other**. | Must |
| SPT-2 | Default mapping from Strava types (draft): Run/TrailRun/VirtualRun → Run · Ride/VirtualRide/GravelRide/MountainBikeRide → Bike · Swim → Swim · WeightTraining → Strength · everything else (incl. e-bike, CrossFit) → Other. | Must |
| SPT-3 | Run and Bike activities are marked **outdoor** or **indoor** (treadmill, trainer, virtual). | Must |
| SPT-4 | The user can choose to include **both** (default), **outdoor only** or **indoor only** for Run and Bike. The choice applies to stats and best efforts. | Must |

## 4. Home (HOME)

*Rewritten 2026-11-10 after the owner's feedback: Home is a **training calendar**, inspired by Garmin Connect's month view. The old "this week / weeks chart / average week" requirements are covered by HOME-4 and HOME-5.*

| ID | Requirement | Priority |
|---|---|---|
| HOME-1 | **Event countdowns at the top** (see EVT): one card per upcoming event with its title, date and **days left**. Adding, editing and removing an event is quick and done right there. | Must |
| HOME-2 | Below the events: a **training calendar**. By default it shows the **current month**, split into weeks, **Monday–Sunday** (or Sunday–Saturday, SET-2). Each row is a week and shows the **week number**; each day shows its **date** (e.g. 4, 5, 6). | Must |
| HOME-3 | Each day lists the workouts done that day, kept small: **title, distance, pace (speed for bike, pace per 100 m for swim) and time**. Each workout uses its sport color and links to the activity on Strava (ACT-4). | Must |
| HOME-4 | A column on the far right shows the **total for each week**: total time, plus distance (or time) per sport. | Must |
| HOME-5 | A row at the bottom shows the **total for the whole period**: distance per sport, time for strength, and total hours. For periods longer than one month it also shows the **average per week**. | Must |
| HOME-6 | **Period picker:** 1 month (pick which month), 3 months, 6 months, 1 year (each can be moved back and forward in time), a **custom** period (from–to date) and **all time**. | Must |
| HOME-7 | Longer periods still show **every week**, but more compactly: 3 months shows small workout chips without titles; 6 months and longer show a mini bar per workout. Each month can be opened in the 1-month view. | Must |
| HOME-8 | The chosen period type is **remembered** for the next visit (per device). | Must |
| HOME-9 | On phones, the calendar becomes a list of weeks (a 7-day strip plus the workouts), since 7 columns don't fit. | Must |
| HOME-10 | Only the activities of the shown period are fetched (lazy loading), so the first load is fast. | Must |

## 4b. Activities (ACT)

| ID | Requirement | Priority |
|---|---|---|
| ACT-1 | ~~A list of all activities grouped by week.~~ *Covered by the Home calendar (HOME-2..7) since 2026-11-10.* | – |
| ACT-2 | Filter the calendar by sport. | Future |
| ACT-3 | An activity detail page shows the key stats: sport, date, duration, distance, pace/speed, heart rate, power, elevation. | Should |
| ACT-4 | Every activity links to its original on Strava ("View on Strava", which Strava's brand guidelines require). | Must |

## 5. Best efforts (BE)

Best efforts are shown on the **Profile** page (2026-11-10: the separate "Records" page is merged into Profile).

| ID | Requirement | Priority |
|---|---|---|
| BE-1 | A best effort is the **fastest time** for a given distance. The exact version is the fastest segment inside any activity (e.g. the fastest 5 km inside a 12 km run), computed from streams (M7). | Must |
| BE-2 | Distances: **Run** 1 km, 5 km, 10 km, 21.1 km, 42.2 km · **Bike** 20, 40, 90, 180 km · **Swim** 400 m, 1 km, 1.9 km, 3.8 km. | Must |
| BE-3 | **Bike power:** best average watts over fixed durations (placeholders: 5 s, 1 min, 5 min, 20 min, 60 min). Only for activities with power data. | Future |
| BE-4 | Each best effort links to the activity it came from, with its date. | Should |
| BE-5 | Best efforts are recomputed when activities are added, edited or deleted. | Must |
| BE-6 | **First version (estimate):** best efforts are estimated from Strava's activity summaries: the best average pace of any activity at least as long as the distance ([ADR 0011](decisions/0011-best-efforts-v1.md)). Exact for races; on the safe (slower) side for segments inside longer activities. | Must |
| BE-7 | The user can **change a best effort** by hand (e.g. a race done before Strava). A manual value wins over the Strava value and can be reset. | Must |

## 6. Events (EVT)

An event is a date to count down to, e.g. "Ironman Copenhagen, 100 days".

| ID | Requirement | Priority |
|---|---|---|
| EVT-1 | A user can create, edit and delete events with a **title** (max 60 characters), a **date** and a **type** (Triathlon, Run, Bike, Swim, Other; default Triathlon). | Must |
| EVT-2 | A user can add a **background image** to an event (JPEG/PNG/WebP, resized in the browser before upload). Otherwise a background in the brand's zone colors is used, based on the type. | Must |
| EVT-3 | All upcoming events are shown as countdowns on Home, sorted by date. "Today!" on the day, "Tomorrow" the day before. Past events disappear from Home. | Must |
| EVT-4 | Events are managed from Home: tap a card to edit, "+" to add. | Must |
| EVT-5 | Hide an event from Home without deleting it. | Future |

## 7. Goals (GOAL)

A goal is a performance target, e.g. "5 km in 18:00". Goals have their own page. The feedback rules are in [feedback-rules.md](feedback-rules.md).

| ID | Requirement | Priority |
|---|---|---|
| GOAL-1 | A user can create and delete goals: a **sport**, **distance** (from BE-2) and **target time**. | Must |
| GOAL-2 | A goal can optionally be linked to an event. | Future |
| GOAL-3 | The goal shows the **gap** between the user's current best effort and the target. | Must |
| GOAL-4 | The goal shows short, simple **feedback** with tips on how to reach it (e.g. *"Your volume is already good. Add one faster session per week."*), plus matching **workouts from the training catalog**. | Must |
| GOAL-5 | **Suggested targets build on the current best:** when the user picks a distance, Stramin shows their current best and suggests faster targets (about 2 %, 5 % and 10 % faster, rounded). A target slower than the current best is not accepted ("You already did 20:00"). | Must |
| GOAL-6 | **Equivalent performances:** for running goals, Stramin shows what the goal means at another distance (e.g. *"10 km in 40:00 usually needs a 5 km of about 19:15"*) and compares it with the user's own best at that distance. | Must |

## 8. Training inspiration (TRN)

A catalog of workouts to get ideas from. The first workouts are placeholders written by Claude; the owner reviews and replaces them.

| ID | Requirement | Priority |
|---|---|---|
| TRN-1 | A catalog of workouts per sport. **Run** first (9 workouts); **Bike** and **Swim** get a few placeholders. | Must |
| TRN-2 | A workout consists of steps (e.g. warm-up, intervals, recovery, cool-down). Each step has a heart-rate **zone** (Z1–Z5), shown in the zone colors. | Must |
| TRN-3 | Each running step shows a **personal target pace** (e.g. "12 × 400 m at 1:28, 3:40/km"), calculated from the user's best efforts with the **VDOT** model ([ADR 0010](decisions/0010-pace-model-vdot.md)). Swim steps show a pace per 100 m based on the swim best efforts. | Must |
| TRN-4 | If the user has no best efforts yet, the workout is shown without paces and with an explanation. | Must |
| TRN-5 | The catalog can be filtered by **sport** and by **effort**: Z1–Z2 (easy), Z3 (moderate), Z4–Z5 (hard). | Must |

## 9. Settings (SET)

| ID | Requirement | Priority |
|---|---|---|
| SET-1 | **Units:** metric (default) or imperial. | Must |
| SET-2 | **Week start:** Monday (default) or Sunday. | Must |
| SET-3 | **Language:** English (default) or Danish. | Must |
| SET-4 | **Indoor/outdoor filter** for Run and Bike (SPT-4). | Must |
| SET-5 | Manage connections (connect/disconnect Strava). | Must |
| SET-6 | **Name** (ACC-5). | Must |

## 10. Privacy (PRIV)

| ID | Requirement | Priority |
|---|---|---|
| PRIV-1 | A user can export all their data (e.g. JSON). | Must |
| PRIV-2 | Deleting the account permanently deletes all data and revokes Strava access. | Must |
| PRIV-3 | A user can only ever access their own data, which is enforced in the database. | Must |
| PRIV-4 | OAuth tokens are encrypted at rest and never sent to the browser. | Must |
| PRIV-5 | A simple privacy policy page. | Must |
| PRIV-6 | A **Terms of Service** page that users accept, including a way to report abuse. | Must |

## 11. Non-functional (NFR)

| ID | Requirement | Priority |
|---|---|---|
| NFR-1 | Installable as a PWA on iPhone and Android. | Must |
| NFR-2 | Mobile first. Also works on desktop. | Must |
| NFR-3 | Home loads fast: data is read from our database, never from Strava on page view. | Must |
| NFR-4 | Stays within Strava's API rate limits. | Must |
| NFR-5 | Follows Strava's API terms and brand guidelines (e.g. "Connect with Strava" button). | Must |
| NFR-5b | Follows Garmin's API terms and brand guidelines: Garmin data is always shown **with Garmin attribution**. | Must |
| NFR-6 | Runs on free tiers. | Must |
| NFR-7 | Accessible: readable contrast and works with screen readers. | Should |

---

## Open questions (can wait until implementation)

- [x] Pace model for TRN-3: **VDOT** ([ADR 0010](decisions/0010-pace-model-vdot.md)).
- [x] Feedback rules for GOAL-4: [feedback-rules.md](feedback-rules.md).
- [ ] Final swim distances and bike power durations.
- [ ] Heart-rate zones in beats per minute (needs the user's max or threshold heart rate).
