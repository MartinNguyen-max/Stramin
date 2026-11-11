# Stramin – Architecture

> **Status:** Draft v0.3 (2026-11-09)
> How Stramin is built. The reasons behind each choice are in [decisions/](decisions/).

## Tech stack

| Layer | Choice | ADR |
|---|---|---|
| Language | TypeScript (strict) | [0001](decisions/0001-framework-nextjs.md) |
| Framework | Next.js (App Router, React Server Components) | [0001](decisions/0001-framework-nextjs.md) |
| Backend platform | Supabase: Postgres, Auth, Storage, Queues, Cron | [0002](decisions/0002-backend-supabase.md) |
| Database access | Drizzle ORM + drizzle-kit migrations | [0003](decisions/0003-orm-drizzle.md) |
| Login | Google + email & password (Supabase Auth) | [0004](decisions/0004-authentication.md) |
| Background jobs | Supabase Queues + Supabase Cron | [0005](decisions/0005-background-sync.md) |
| UI | Tailwind CSS, shadcn/ui (Base UI), Recharts, next-themes | [0006](decisions/0006-ui-stack.md) |
| Tooling | pnpm, Biome, Vitest, Playwright, next-intl, Serwist | [0007](decisions/0007-tooling.md) |
| Hosting | Vercel (app) + Supabase Cloud (data) | [0002](decisions/0002-backend-supabase.md) |
| Stream storage | Compressed files in Supabase Storage | [0008](decisions/0008-stream-storage.md) |

Versions: the latest stable version of each tool at project setup.

## System overview

```
                  ┌──────────────────────────────┐
  User (PWA) ───▶ │  Next.js on Vercel           │
                  │  • Pages (Server Components) │
                  │  • Server Actions            │
                  │  • Route handlers:           │
                  │    /auth/callback            │
                  │    /api/strava/callback      │
                  │    /api/strava/webhook  ◀────┼──── Strava (new/edited/
                  │    /api/jobs/run        ◀──┐ │      deleted activity)
                  └──────────┬─────────────────┼─┘
                             │                 │ every minute
                             ▼                 │
                  ┌──────────────────────────────┐
                  │  Supabase                    │
                  │  • Postgres (+ RLS)          │
                  │  • Auth (Google, email)      │
                  │  • Storage (event images)    │
                  │  • Queues (sync jobs)        │
                  │  • Cron ─────────────────────┘
                  └──────────────────────────────┘
                             │
  /api/jobs/run ───────────▶ Strava API (activities, streams)
```

**Rule:** pages only read from our database. Only the job runner talks to the Strava API (NFR-3, NFR-4).

## Data flows

> **Built 2026-11-10 as [ADR 0012](decisions/0012-strava-sync-v1.md):** activity summaries only, no queue yet. Streams (M7) will add the queue from ADR 0005.

### 1. Connect Strava (CON-1, CON-3)
1. The user clicks "Connect with Strava" and goes through Strava OAuth (`/api/strava/connect`, logged-in users only).
2. `/api/strava/callback` checks the state and the granted scope, exchanges the code for tokens and stores them **encrypted** in `connections`.
3. It redirects to Home at once and imports the history with `after()` (~5 requests). Home shows the progress until it's done.

### 2. New activity on Strava (CON-4)
1. Strava calls `/api/strava/webhook` with `{ object id, create|update|delete }`.
2. The handler answers at once (Strava wants an answer within 2 seconds) and, with `after()`, fetches the activity and upserts it, or deletes it.
3. "Deauthorized" on Strava's side deletes the connection and all its activities.

### 3. Manual refresh (CON-5)
The Refresh button runs a quick sync: the activities of the last few days.

### 3b. Strava rolling cache ([ADR 0009](decisions/0009-strava-rolling-cache.md))
Every activity has `fetched_at`. The hourly job re-fetches all summaries once a day (a full refresh), and deletes Strava activities that weren't re-fetched for 7 days.

### 3c. Garmin
Garmin pushes new activities to a webhook (Starter tier, no history). The author's own data can also be pulled with a Personal API key. The details follow once access is granted.

### 4. Job runner
- Supabase Cron calls `/api/jobs/run` **every hour** (`pg_cron` + `pg_net`). The call sends `Authorization: Bearer <CRON_SECRET>`; the secret is in Supabase Vault (`cron_secret`) and in Vercel (`CRON_SECRET`).
- Per connection: finish an unfinished import, a full refresh when the last one is > 24 h old, otherwise a quick sync when the last sync is > 3 h old, then delete Strava data older than 7 days.
- **Rate limits:** Strava's usage headers are checked after each call. At 80 % of the 15-minute or daily limit the run stops; the next hour continues.
- A failed connection keeps its error in `connections.last_error` and is retried next hour.

### 5. Best efforts (BE-1..5)
- For every activity with streams, compute the **fastest segment** for each distance (sliding window over the distance stream) and the **best average power** for each duration (sliding window over time).
- Results are stored **per activity** in `activity_best_efforts`. A user's record is the best row across their activities.
- This keeps recomputation simple: when an activity is deleted, its rows are deleted and the records update automatically.
- The algorithms are pure functions in `src/lib/analytics/`, fully unit tested.

## Data model (draft)

All values are stored in **SI units** (meters, seconds, watts). Units are converted in the UI only (SET-1).

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | user_id, units, week_start, locale, indoor_filter_run, indoor_filter_bike | 1:1 with `auth.users` |
| `connections` | id, user_id, provider, provider_athlete_id, athlete_name, access_token_enc, refresh_token_enc, expires_at, scopes, import_state, imported_count, last_full_sync_at, last_sync_at, last_error | `provider` = strava / garmin (CON-6). **No grants and no RLS policies for users: only the server reads it** (admin connection, always filtered by user id). **Built 2026-11-10.** |
| `activities` | id, user_id, provider, provider_activity_id, name, sport, sport_type, is_indoor, start_time, start_local, moving_seconds, elapsed_seconds, distance_m, elevation_m, fetched_at | `sport` ∈ swim/bike/run/strength/other. Users can only **read** their own rows (RLS); only the server writes. `start_local` is Strava's local time as text ("2026-11-02T07:15:00Z"). **Built 2026-11-10.** |
| *(Storage)* `streams/{user_id}/{activity_id}` | time, distance, heartrate, watts, altitude | Compressed file per activity, not in Postgres ([ADR 0008](decisions/0008-stream-storage.md)) |
| `activity_best_efforts` | activity_id, user_id, sport, kind (distance/power), target, result, start_offset | One row per activity per distance/duration |
| `events` | id, user_id, title, event_date, type, image_path, image_x, image_y (image position %), created_at | EVT. **Built 2026-11-10.** |
| *(Storage)* bucket `event-images`, path `{user_id}/{file}` | Event background images (WebP, resized in the browser) | Private bucket; RLS: users only reach their own folder. Shown with short-lived signed URLs. |
| `goals` | id, user_id, sport (run/bike/swim/triathlon), distance_m, target_seconds, swim/bike/run/transition_seconds (triathlon splits, null otherwise), created_at | GOAL. **Built 2026-11-10;** triathlon splits 2026-11-11. |
| `personal_bests` | user_id, sport, distance_m (together the key), seconds, achieved_on, updated_at | **Manual** best efforts only (BE-7, [ADR 0011](decisions/0011-best-efforts-v1.md)). **Built 2026-11-10.** |
| `webhook_events` | id, payload, received_at, processed_at | Audit and debugging *(not built: Vercel logs are enough for now)* |
| `api_usage` | provider, window, used, limit | Rate-limit tracking *(not built: usage headers are checked per run, ADR 0012)* |

**Weeks** are grouped by `start_time_local` (the athlete's local time), using the user's week-start setting.
**Training workouts** (TRN) are static content stored as typed TypeScript/JSON in the codebase, not in the database.

### Reading activities
- Since M3/M4 (2026-11-10), pages read activities from the `activities` table (as the user, RLS), never from Strava (NFR-3). The calendar reads only the visible weeks (HOME-10).
- The Vercel functions run in **Dublin (`dub1`)**, next to the Supabase database (`eu-west-1`), so each database round trip is short.

### Small per-device preferences
- The calendar's **period type** (HOME-8) is stored in a cookie, `stramin-calendar` (1 year), set by a Server Action. It's a view setting that can differ between phone and desktop, so it isn't stored in the database.

## Security (PRIV, NFR)

- **Row Level Security** on every user table: a user can only access rows where `user_id = auth.uid()`.
- **Drizzle + RLS:** user requests run in a transaction with the user's JWT claims and the `authenticated` role, so RLS is enforced. Only the job runner and webhook use the privileged connection.
- **Tokens:** Strava tokens are encrypted in the app with AES-256-GCM. The key is stored in Vercel's environment variables. `connections` has no RLS policies for users, so it is unreachable from the browser.
- **Secrets** live only in environment variables, never in the repo.
- **Account deletion** revokes the Strava token (deauthorize) and cascades all deletes.

## Project structure

```
stramin/
├─ docs/                     # Vision, requirements, UI spec, architecture, ADRs, plan
├─ src/
│  ├─ app/
│  │  ├─ [locale]/           # en / da
│  │  │  ├─ (marketing)/     # landing, privacy policy
│  │  │  ├─ (auth)/          # login, sign up
│  │  │  └─ (app)/           # home, goals, training, profile, settings
│  │  ├─ api/
│  │  │  ├─ strava/          # callback, webhook
│  │  │  └─ jobs/run/        # job runner
│  │  └─ auth/callback/
│  ├─ components/            # shared UI (shadcn/ui lives in components/ui)
│  ├─ features/              # feature modules: activities, calendar, events, goals, profile, training…
│  ├─ lib/
│  │  ├─ db/                 # Drizzle schema, client, RLS helpers
│  │  ├─ supabase/           # Supabase clients (server/browser)
│  │  ├─ strava/             # Strava API client, OAuth, type mapping
│  │  ├─ sync/               # jobs and queue handling
│  │  ├─ analytics/          # best efforts, weekly aggregates (pure, tested)
│  │  ├─ crypto/             # token encryption
│  │  └─ storage/            # stream file storage (swappable provider)
│  ├─ i18n/                  # next-intl config
│  └─ messages/              # en.json, da.json
├─ supabase/                 # Supabase CLI config (local dev)
│  └─ migrations/            # SQL migrations, generated by drizzle-kit, applied by Supabase CLI
├─ tests/e2e/                # Playwright
└─ public/                   # icons, manifest assets
```

## Environments

| Environment | App | Database |
|---|---|---|
| Preview | Vercel preview per pull request (this is where we test) | Supabase cloud project (shared with production) |
| Production | Vercel | Supabase cloud project |
| Local *(optional, not used)* | `pnpm dev` on localhost:3000 | Supabase CLI (local Docker, ports 553xx) |

We test on previews instead of a local Docker database, because it is faster to work with. Preview and production share one database while the owner is the only user. Before other users join, we add a separate dev project for previews.

Strava webhooks need a public URL. Locally we use the manual Refresh, or a tunnel when testing webhooks.

## Internationalization (SET-3)

- **next-intl**, with the language in the URL. English is the default and has no prefix: `/home` = English, `/da/home` = Danish.
- All pages live under `src/app/[locale]/`, which is the root layout. Each language is pre-built (`generateStaticParams`), which works with Cache Components.
- The locale is read with Next's `next/root-params`, so components don't need it passed down.
- `src/proxy.ts` redirects visitors to their language (browser setting, later also the user's saved setting).
- Texts live in `src/messages/en.json` and `da.json`. Keys are type-checked against `en.json`.
- Always use `Link`, `redirect` and `useRouter` from `@/i18n/navigation`, never directly from Next.
- **Considered:** `localePrefix: "never"` (no language in the URL, language remembered in a cookie). It keeps the caching, and is a one-line change if the `/da` URLs ever become a problem.

## CI

GitHub Actions on every pull request: Biome check → type check → Vitest → build. Playwright runs on preview deployments.

## Open questions

- [x] **Strava data terms:** checked. See [research](research/strava-api-terms.md) and [ADR 0009](decisions/0009-strava-rolling-cache.md).
- [ ] **Garmin terms:** rules on storage and analytics, to be read when we get access.
