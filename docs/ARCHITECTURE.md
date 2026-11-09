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

### 1. Connect Strava (CON-1, CON-3)
1. The user clicks "Connect with Strava" and goes through Strava OAuth.
2. `/api/strava/callback` exchanges the code for tokens and stores them **encrypted** in `connections`.
3. A `backfill` job is put on the queue.
4. The job runner imports the history page by page and queues one `fetch_activity` job per activity.

### 2. New activity on Strava (CON-4)
1. Strava calls `/api/strava/webhook` with `{ activity id, create|update|delete }`.
2. The handler saves the event and queues a job. It answers within 2 seconds, as Strava requires.
3. The job runner fetches the activity and its streams, then computes best efforts.

### 3. Manual refresh (CON-5)
The user clicks Refresh, which queues a `sync_recent` job (fetching activities since the last sync).

### 3b. Strava rolling cache ([ADR 0009](decisions/0009-strava-rolling-cache.md))
Strava data may be cached for at most 7 days. A `refresh_expiring` job re-fetches Strava activities before they turn 7 days old. A cleanup job deletes anything that could not be refreshed in time.

### 3c. Garmin
Garmin pushes new activities to a webhook (Starter tier, no history). The author's own data can also be pulled with a Personal API key. The details follow once access is granted.

### 4. Job runner
- Supabase Cron calls `/api/jobs/run` every minute. The call is protected by a shared secret.
- Each run takes a small batch of jobs from the queue and processes them within the function time limit.
- **Rate limits:** Strava's usage headers are stored after each call. When close to the limit, the runner stops and continues in the next window.
- Failed jobs are retried with a delay.

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
| `connections` | user_id, provider, provider_athlete_id, access_token_enc, refresh_token_enc, expires_at, scopes, last_synced_at | `provider` = strava / garmin (CON-6). **Never readable from the browser.** |
| `activities` | id, user_id, provider, provider_activity_id, sport, raw_type, is_indoor, name, start_time, start_time_local, moving_time, elapsed_time, distance, elevation_gain, avg_hr, avg_power | `sport` ∈ swim/bike/run/strength/other |
| *(Storage)* `streams/{user_id}/{activity_id}` | time, distance, heartrate, watts, altitude | Compressed file per activity, not in Postgres ([ADR 0008](decisions/0008-stream-storage.md)) |
| `activity_best_efforts` | activity_id, user_id, sport, kind (distance/power), target, result, start_offset | One row per activity per distance/duration |
| `events` | id, user_id, name, date, type, image_path, hidden_on_home | EVT |
| `goals` | id, user_id, sport, distance, target_time, event_id? | GOAL |
| `webhook_events` | id, payload, received_at, processed_at | Audit and debugging |
| `api_usage` | provider, window, used, limit | Rate-limit tracking |

**Weeks** are grouped by `start_time_local` (the athlete's local time), using the user's week-start setting.
**Training workouts** (TRN) are static content stored as typed TypeScript/JSON in the codebase, not in the database.

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
│  │  │  └─ (app)/           # home, activities, goals, training, records, settings
│  │  ├─ api/
│  │  │  ├─ strava/          # callback, webhook
│  │  │  └─ jobs/run/        # job runner
│  │  └─ auth/callback/
│  ├─ components/            # shared UI (shadcn/ui lives in components/ui)
│  ├─ features/              # feature modules: activities, events, goals, records, training…
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
| Local | `pnpm dev` on localhost:3000 | Supabase CLI (local Docker, ports 553xx) |
| Preview | Vercel preview per pull request | Supabase dev project |
| Production | Vercel | Supabase production project |

Strava webhooks need a public URL. Locally we use the manual Refresh, or a tunnel when testing webhooks.

## Internationalization (SET-3)

- **next-intl**, with the language in the URL. English is the default and has no prefix: `/home` = English, `/da/home` = Danish.
- All pages live under `src/app/[locale]/`, which is the root layout. Each language is pre-built (`generateStaticParams`), which works with Cache Components.
- The locale is read with Next's `next/root-params`, so components don't need it passed down.
- `src/proxy.ts` redirects visitors to their language (browser setting, later also the user's saved setting).
- Texts live in `src/messages/en.json` and `da.json`. Keys are type-checked against `en.json`.
- Always use `Link`, `redirect` and `useRouter` from `@/i18n/navigation`, never directly from Next.

## CI

GitHub Actions on every pull request: Biome check → type check → Vitest → build. Playwright runs on preview deployments.

## Open questions

- [x] **Strava data terms:** checked. See [research](research/strava-api-terms.md) and [ADR 0009](decisions/0009-strava-rolling-cache.md).
- [ ] **Garmin terms:** rules on storage and analytics, to be read when we get access.
