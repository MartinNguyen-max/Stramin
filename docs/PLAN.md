# Stramin – Plan

> **Status:** Draft v0.1 (2026-11-09)
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
- [~] Supabase Auth: Google + email & password, verification, password reset (ACC-1..3) *(code done; local login hangs, see open issue below; Google needs setup)*
- [x] `profiles` table with RLS, and the RLS-aware Drizzle client (PRIV-3)
- [x] Protected app area + log out
- [x] Landing page: **Log in** and **Sign up** buttons (replacing "Coming soon")
- [ ] **Open issue:** login/sign-up hangs against local Supabase (server action waits for an answer). Investigate next.
- [ ] Supabase cloud project + Vercel env vars, so login works on stramin.vercel.app
- [x] Settings: units, week start, language (SET-1..3) *(not yet verified end-to-end)*

✅ **Done when:** you can sign up, log in, change settings and log out.

### M3 – Strava connection
- [ ] Strava OAuth with "Connect with Strava" button (CON-1, NFR-5)
- [ ] Token encryption + `connections` table (PRIV-4)
- [ ] Disconnect + deauthorize + delete data (CON-2)

✅ **Done when:** you can connect and disconnect your Strava account.

### M4 – Sync engine
- [ ] `activities` table, sport mapping and indoor flag (SPT-1..3)
- [ ] Supabase Queues + Cron → `/api/jobs/run`, with rate-limit tracking (NFR-4)
- [ ] History import with progress (CON-3)
- [ ] Strava webhook: create/update/delete/deauthorize (CON-4)
- [ ] Refresh button (CON-5)
- [ ] Rolling 7-day cache: refresh and cleanup jobs (CON-8)

✅ **Done when:** your full Strava history is in the database and new activities appear automatically.

### M5 – Activities
- [ ] Decide the **navigation pattern** (UI_SPEC open question)
- [ ] Activity list grouped by week, with weekly totals (ACT-1, ACT-2)
- [ ] Activity detail + "View on Strava" (ACT-3, ACT-4)

✅ **Done when:** you can browse all your activities week by week.

### M6 – Home
- [ ] Decide the **Home layout** (UI_SPEC open question)
- [ ] This week by sport (HOME-1)
- [ ] Week comparison chart (HOME-2)
- [ ] Average volume with period picker (HOME-3)

✅ **Done when:** Home shows correct numbers, checked against Strava.

### M7 – Best efforts
- [ ] Stream fetching + compressed storage (ADR 0008)
- [ ] Fastest-segment and best-power algorithms, unit tested (BE-1..3)
- [ ] Top-3 retention for the Strava cache (ADR 0009)
- [ ] Records page with indoor/outdoor filter (BE-4, BE-5, SPT-4, SET-4)

✅ **Done when:** your records match what you expect from your own history.

### M8 – Events & goals
- [ ] Events: CRUD, image upload, default images (EVT-1, EVT-2, EVT-4)
- [ ] Countdowns on Home, hideable (HOME-4, EVT-3)
- [ ] Goals: CRUD + gap to current best (GOAL-1..3)
- [ ] Write the feedback rules doc → implement feedback (GOAL-4)

✅ **Done when:** your Ironman countdown is on Home, and a 5 km goal shows the gap and feedback.

### M9 – Training library
- [ ] Write the ~10 running workouts *(owner: you)*
- [ ] Decide the pace model (new ADR)
- [ ] Workout list + detail with personal paces (TRN-1..4)

✅ **Done when:** each workout shows your personal target paces.

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

## Open items

- [ ] **Duplicates (M10):** exact tolerances (e.g. start ±5 min, duration/distance ±5 %), and which version is shown. *Recommendation: Garmin, because it is the original device data and isn't limited to 7 days.* To be decided before M10.
