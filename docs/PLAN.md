# Stramin – Plan

> **Status:** Draft v0.2 (2026-11-10)
> Milestones for the first release. Requirement IDs refer to [REQUIREMENTS.md](REQUIREMENTS.md).
> Each milestone ends with something that **works and is deployed**.

## Workflow

- One **branch + pull request** per task or small group of tasks. `main` is always deployable.
- CI (lint, type check, tests, build) must pass before merging.
- Commit messages follow **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:` …).
- Docs are updated in the same PR when a decision changes.

## Milestones

### M0 – Prerequisites *(owner: you)*
- [x] Install Node.js (LTS), pnpm and Docker Desktop
- [ ] Create accounts: Supabase, Vercel (log in with GitHub)
- [ ] Get a Strava subscription and create a Strava API app
- [x] Garmin Starter application *(sent and **accepted** 2026-11-09)*

### M1 – Project setup
- [x] Scaffold Next.js (TypeScript strict, App Router, `src/`)
- [x] Tooling: Biome, Vitest, Playwright
- [x] Tailwind CSS + shadcn/ui, light/dark theme
- [x] next-intl with English and Danish
- [x] Supabase local (CLI + Docker) and Drizzle setup
- [x] GitHub Actions CI
- [x] Landing page + privacy policy page (PRIV-5)
- [x] Deploy to Vercel: **https://stramin.vercel.app**

✅ **Done when:** the landing page is live on a Vercel URL, and CI is green.

### Garmin test (spike, before M2)
Goal: prove that Garmin works before building more. Throwaway code, no database.
- [x] Garmin keys in `.env.local` and Vercel
- [x] "Connect Garmin" → Garmin login → back to Stramin showing the Garmin user ID and permissions
- [x] Webhook receives a real activity (seen in Vercel logs) *(2026-11-09: summary + details with ~1 sample/s)*

✅ **Done when:** a real activity from your Garmin arrives at Stramin.

### Strava data test (spike, before M2)
- [x] Connect Strava → fetch the full history → hours per week per sport on `/strava-test` *(2026-11-09: 863 activities back to 2023-06, 154 weeks, 364 indoor)*

### M2 – Accounts
- [x] Supabase Auth: email & password, verification, password reset (ACC-1..3) *(works online, 2026-11-09)*
- [x] Google login (ADR 0004) *(works online, 2026-11-10)*
- [x] Log in with a saved login: show "Continue as {name}" / "Use another account" instead of logging in silently (ACC-3) *(built, to test on a preview)*
- [x] Name: "What should we call you?" at sign up, from Google, editable in Settings (ACC-5) *(built, to test)*
- [x] Google button styled after Google's guideline, with the official G logo *(built, to test)*
- [x] `profiles` table with RLS, and the RLS-aware Drizzle client (PRIV-3)
- [x] Protected app area + log out
- [x] Landing page: **Log in** and **Sign up** buttons (replacing "Coming soon")
- [x] ~~Check local login~~ *(dropped 2026-11-10: no local Docker database, we test on Vercel previews)*
- [x] Supabase cloud project (EU) + Vercel env vars: login works on stramin.vercel.app
- [x] Settings: units, week start, language (SET-1..3)
- [x] Zone spinner as loading indicator; Strava data cached in the browser for 6 h (until M4)

✅ **Done when:** you can sign up, log in, change settings and log out.

### M2.5 – New Home, Goals, Training, Profile *(work mode, 2026-11-10)*
The owner's request of 2026-11-10 (Garmin-style calendar, events, profile, goals, training inspiration). Built before M3/M4 on the temporary Strava connection. Decisions to review: [REVIEW.md](REVIEW.md).
- [x] Docs: requirements, UI spec, ADR 0010 (VDOT), ADR 0011 (best efforts v1), feedback rules
- [x] Navigation: bottom tabs on phones, header links on desktop (Home, Goals, Training, Profile, Settings ⚙)
- [x] Home: training calendar with week numbers, dates, workouts, week totals and period totals (HOME-2..5)
- [x] Home: period picker 1M / 3M / 6M / 1Y / custom / all, remembered per device, compact and mini views (HOME-6..9)
- [x] Home: fetch only the shown period from Strava (HOME-10)
- [x] Events with countdown, image upload and default backgrounds (HOME-1, EVT-1..4) *(needs the migrations)*
- [x] Profile: best efforts (estimate + manual), running level and paces (BE-2, BE-4, BE-6, BE-7) *(manual values need the migrations)*
- [x] Training inspiration: catalog with zone filter and personal paces (TRN-1..5)
- [x] Goals: suggestions, gap, equivalent performances, feedback, workouts (GOAL-1, GOAL-3..6) *(needs the migrations)*
- [x] Database: `events`, `goals`, `personal_bests`, `event-images` bucket (migrations written) *(owner applies them: see REVIEW.md)*
- [x] Demo pages with example data (`/demo`, `/demo/goals`, `/demo/training`, `/demo/profile`), also used for screenshots
- [ ] Owner: push and review on a preview *(migrations applied 2026-11-10)*

✅ **Done when:** the owner has reviewed the new Home and pages on a preview, and the migrations are applied.

### M3.7 – Owner feedback 2026-11-12 *(local, one change at a time; see [REVIEW](REVIEW.md) #49–67)*
- [x] Average week on top, month cards for 6M/1Y/All, "this week so far", phone week total on the right
- [x] Goals: plausible times, time fields that format themselves, triathlon with race-day fatigue, quarter Ironman, short tips with "Read more"
- [x] Pace calculator tab (all sports and triathlon, compared with your bests, "Set as goal")
- [x] Profile: one level card for all sports, "Your progress" (3/6/12 months)
- [x] PWA (install, offline page), onboarding for new users, landing page with PC and phone screens
- [ ] Owner: commit, push and merge `feat/feedback-3`; `supabase db push --remote` only if not done for the goal splits

### M3.6 – Owner feedback 2026-11-11 *(work mode; see [feedback](feedback/2026-11-11.md))*
- [x] Calendar: hours first with sport icons, swims in km in totals, the average week as the main number, week overview grouped by month with each month's average week, folding months (HOME-4, 5, 7)
- [x] Phone: hours + distance per week under every week; month cards with averages and icons (HOME-9)
- [x] "Synced … ago" stays current (CON-5)
- [x] Goals: half/full Ironman with a time per discipline, pace beside every time, the gap per km (GOAL-1, GOAL-3)
- [x] Profile: bike and swim predictions (BE-9); Training: "53 min" / "1:20 h"
- [ ] Owner: `supabase db push --remote` (goal split columns) **before** merging; review

### M3.5 – Owner feedback 2026-11-10 *(work mode; see [feedback](feedback/2026-11-10.md))*
- [x] Calendar: week totals with time + distance, weekly averages over finished weeks, 3M in full detail, week overview for longer periods, ‹ › by one month, phone month grid (HOME-4..9)
- [x] No empty calendar while importing; database connection retry (H3, H11)
- [x] Profile: runs count pauses, Strava's exact best efforts, bike 100/120 km, best power + FTP, race predictions (BE-2, BE-3, BE-8, BE-9, ADR 0013)
- [x] Training: block graphs, distance, tap for steps, more bike and swim workouts (TRN)
- [x] Landing page with the real app and example data
- [x] Owner: `supabase db push --remote` (new activity columns) **before** merging; review
- [ ] Later: a video for the landing page

### M3 – Strava connection *(built 2026-11-10, work mode; to test on the live site)*
- [x] Strava OAuth with "Connect with Strava" button (CON-1, NFR-5) *(Strava's official button artwork still to swap in before release)*
- [x] Token encryption (AES-256-GCM) + `connections` table (PRIV-4)
- [x] Disconnect + deauthorize + delete data (CON-2)
- [x] Speed: Vercel functions in Dublin next to the database; one round trip for RLS; one session check per request

✅ **Done when:** you can connect and disconnect your Strava account.

### M4 – Sync engine *(built 2026-11-10 as [ADR 0012](decisions/0012-strava-sync-v1.md); to test on the live site)*
- [x] `activities` table, sport mapping and indoor flag (SPT-1..3)
- [x] Hourly Supabase Cron → `/api/jobs/run`, with rate-limit checks (NFR-4) *(no queue yet, ADR 0012)*
- [x] History import with progress (CON-3)
- [x] Strava webhook: create/update/delete/deauthorize (CON-4) *(subscription registered after deploy: `node scripts/strava-webhook.mjs create`)*
- [x] Refresh button (CON-5)
- [x] Rolling 7-day cache: daily full refresh and cleanup (CON-8)
- [ ] Owner: apply the migrations (`pnpm exec supabase db push --remote`), push, connect Strava once, check that Home fills up

✅ **Done when:** your full Strava history is in the database and new activities appear automatically.

### M5 – Activities
- [x] ~~Navigation pattern~~ *(decided in M2.5)*
- [x] ~~Activity list grouped by week~~ *(replaced by the Home calendar, M2.5)*
- [ ] Activity detail page (ACT-3) *(Should; every workout links to Strava for now, ACT-4)*
- [ ] Sport filter on the calendar (ACT-2, Future)

### M6 – Home
- [x] ~~This week, week chart, average week~~ *(replaced by the calendar, M2.5)*
- [x] Switch the calendar (and Profile, Goals, Training) to the `activities` table (NFR-3) *(2026-11-10)*

✅ **Done when:** Home shows correct numbers, checked against Strava.

### M7 – Best efforts (exact)
- [ ] Stream fetching + compressed storage (ADR 0008)
- [ ] Fastest-segment and best-power algorithms, unit tested (BE-1, BE-3)
- [ ] Replace the estimates (ADR 0011) with exact segments; manual values stay (BE-5)
- [ ] Top-3 retention for the Strava cache (ADR 0009)
- [ ] Indoor/outdoor filter (SPT-4, SET-4)

✅ **Done when:** your records match what you expect from your own history.

### M8 – Events & goals (rest)
- [ ] Link a goal to an event (GOAL-2, Future)
- [ ] Hide an event without deleting it (EVT-5, Future)

### M9 – Training library (rest)
- [ ] Replace Claude's placeholder workouts with your own *(owner: you)*
- [ ] Heart-rate zones in bpm (needs max/threshold heart rate)

### M10 – Garmin *(starts when Garmin approves)*
- [ ] Garmin OAuth + push webhook (CON-7)
- [ ] Map Garmin activities into the same model
- [ ] Duplicate detection: match on sport, start time, duration and distance within tolerances (CON-9)
- [ ] One-time history import from a Garmin/Strava export ZIP, with a guide page (CON-10). Garmin's API gives no history, so this is the history option for Garmin-only users.

✅ **Done when:** a Garmin-only user gets the same experience as a Strava user.

### M11 – Privacy, PWA & release
- [ ] Data export (PRIV-1) and account deletion (ACC-4, PRIV-2)
- [ ] PWA: manifest, icons, Serwist service worker (NFR-1)
- [ ] Accessibility pass (NFR-7)
- [ ] Redesign the landing page as a **preview of the web app**, with real screens (the M1 version is a placeholder)
- [x] Upgrade the Strava app to 10 athletes *(done 2026-11-09)*
- [ ] **Garmin release checklist** (details in the private notes, `docs/research/garmin/NOTES.md`):
  - [ ] Garmin attribution on every screen that shows Garmin data (NFR-5b)
  - [ ] Send screenshots/mockups of those screens to Garmin **at least 30 days before release**
  - [ ] Terms of Service page (PRIV-6)
- [ ] 🎉 Release

## Later (small polish)

- [ ] Use the zone spinner everywhere something loads (no other spinners)

## Open items

- [ ] **Fast first load (M4):** don't make the user wait for the full history. *Partly done (2026-11-10): Home fetches only the shown period (HOME-10). Still open for the sync engine.* Options:
  - **A. Recent first, rest in the background.** Fetch the last 3 months first (1 Strava request), show Home right away, then import the older history in the background. If the user picks a longer period before that is done, fetch that range first. *Recommendation:* records (M7) and "all time" averages still get the full history.
  - **B. Only on demand.** Fetch older data only when the user picks a longer period. Fewer requests, but records and averages would be incomplete, and every first look at an old period waits for Strava.

- [ ] **Duplicates (M10):** exact tolerances (e.g. start ±5 min, duration/distance ±5 %), and which version is shown. *Recommendation: Garmin, because it is the original device data and isn't limited to 7 days.* To be decided before M10.
