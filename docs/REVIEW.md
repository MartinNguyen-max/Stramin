# To review with the owner

> Decisions Claude made in **work mode** while the owner was away (CLAUDE.md → Work mode).
> Each one can be discussed and changed. When a point is settled, move it out of this list (or delete it).

## Batch 2026-11-10: new Home, Goals, Training, Profile (M2.5)

### Product and design

| # | Decision | Why | Alternatives |
|---|---|---|---|
| 1 | **Navigation:** bottom tab bar on phones (Home, Goals, Training, Profile), links in the header on desktop. Settings behind a ⚙ icon; **Log out moved to Settings**. | The standard pattern for installed apps (PWA); one tap to every section. | Sidebar on desktop; hamburger menu. |
| 2 | **Home = events + calendar.** The old "This week", "Weeks" and "Average week" boxes are removed. The week total column and the period total row replace them. | The owner wanted a Garmin-style calendar instead. | Keep the old boxes below the calendar. |
| 3 | **Long periods:** every week stays visible, but denser: 1 month = detailed chips; 3 months = compact chips (icon + distance/time); 6 months and longer = mini bars per workout. The month name in the left column opens that month. | Shows all weeks at once, and you can still zoom in to a month. | Stacked month calendars; a heatmap without workouts. |
| 4 | **Chips show:** title, distance · pace (run min/km, bike km/h, swim min/100 m), time. Tapping opens the activity on Strava. | Pace is unusual for bikes; km/h is what cyclists read. | Pace for every sport. |
| 5 | **The period type is remembered per device** (cookie), not in the database. | It's a view setting, and phone and desktop may want different ones; works without a database change. | Store it in `profiles` (same on all devices). |
| 6 | **Custom period** = two date fields (from–to). Moving ‹ › jumps by the period's length; "Today" jumps back. | Simple, and works on all browsers. | A month picker. |
| 7 | **Events:** title, date, type (Triathlon/Run/Bike/Swim/Other) and an optional image. Without an image: a gradient in the zone colors by type. Past events disappear from Home. "Hide" is dropped for now. | Clean, as asked. The type gives a nice default background. | No type; hide instead of delete. |
| 8 | **Profile = best efforts** (the planned "Records" page is merged into it), plus the running level (VDOT) and training paces. | The owner asked for best efforts on the profile. | A separate Records page. |
| 9 | **Best effort distances:** Run 1k, 5k, 10k, half, marathon · Bike 20, 40, 90, 180 km · Swim 400 m, 1k, 1.9k, 3.8k. | Common race and triathlon distances. | The longer list in the old BE-2. |
| 10 | **Best efforts v1 are estimates** from Strava's activity summaries, plus manual values that win ([ADR 0011](decisions/0011-best-efforts-v1.md)). | Works now, with no extra Strava requests. Exact segments come with M7. | Fetch Strava's detailed `best_efforts` per run (many requests). |
| 11 | **Pace model = VDOT** (Jack Daniels) for training paces and race equivalents ([ADR 0010](decisions/0010-pace-model-vdot.md)). | One model for both, well known, matches Daniels' tables. | Riegel (predictions only). |
| 12 | **Goal rules:** suggestions 2 / 5 / 10 % faster than the best; slower targets refused; gap message; speed check against the next shorter distance; volume check vs. a table ([feedback-rules.md](feedback-rules.md)). | Simple and explainable, as asked. | More complex models. |
| 13 | **Training catalog:** 9 running workouts (3 easy, 3 moderate, 3 hard) and a few bike/swim placeholders, **written by Claude**. Please replace them with your own. | Placeholders, as asked. | – |
| 14 | **Zone labels:** Z1 Recovery · Z2 Endurance · Z3 Tempo · Z4 Threshold · Z5 VO2max. No bpm yet (needs max/threshold heart rate). | Standard 5-zone model. | Bpm ranges from a max-HR setting (later). |
| 15 | **Demo pages** (`/demo`, `/demo/goals`, `/demo/training`, `/demo/profile`) with example data, read-only, linked from the "Connect Strava" card. Used to look at the design without logging in, and later for the landing page preview. | Without a local database Claude couldn't otherwise see the logged-in pages. | – |
| 16 | **Profile shows the three sports side by side** (stacked on phones) instead of tabs. | Everything visible at once; only 4–5 rows per sport. | Tabs. |
| 17 | **Week numbers:** ISO 8601 with a Monday start, US style with a Sunday start. | The standard in Denmark/Europe. | – |
| 18 | **Settings, Goals and Profile keep a readable width**; Home and the training catalog use the full width (max 1280 px). | The calendar needs room for 7 days + totals. | – |

## Batch 4 – 2026-11-11: owner feedback ([feedback/2026-11-11.md](feedback/2026-11-11.md))

| # | Decision | Why | Alternatives |
|---|---|---|---|
| 35 | **Durations people read as time spent** show as "53 min" under an hour and "5:50 h" (Danish "t") from an hour: totals, averages and workouts. Day cells keep "1:05". | Owner feedback C1, T5. | Always h:mm. |
| 36 | **Totals show swims in km** (one decimal; no decimals from 100 km). The calendar days keep meters. | Owner feedback C1. | – |
| 37 | **The average week is the main block**, the period total a line below it. For long periods the block moves **above** the week overview, so you don't scroll past 52 weeks to find it. | Owner feedback C2. | Always below. |
| 38 | **Week overview grouped by month: a week belongs to the month with most of its days** (its 4th day); weeks at the edges go to the first/last month shown. Each month's average uses its finished weeks. Weeks that haven't started are hidden. | Every week is under exactly one month, and the month's average is a real "average week". | Split weeks across months; average = month total ÷ days × 7. |
| 39 | **Week rows show hours + distance per sport** (time only for strength); per-sport time is in the tooltip. | Owner feedback C3: "total hours and total distance in each"; one line per week keeps it compact. | Time and distance per sport (two lines). |
| 40 | **Months fold** (tap the header). Open by default: desktop up to 13 months, phone up to 7; longer periods only open the newest month, so all time (and 1Y on the phone) becomes a list of month averages. | Owner feedback C4, M2 (long scroll). | Year groups; always open. |
| 41 | **Phone calendar: a strip under every week** with hours and distance per sport (sport icons), instead of the Σ column; the day panel only lists the day's workouts. | Owner feedback M1: distance per week is needed and the Σ column had no room. | Tap the Σ cell for a week panel; horizontal scroll. |
| 42 | **Sport icons in their colors** (waves, bike, shoe, dumbbell) in all totals instead of colored dots. | Owner feedback M2 ("is green the bike?"). | A legend. |
| 43 | **"Synced … ago" counts on every 30 s**, and the page reloads its data every 5 minutes while visible and when the tab is opened again. | Owner feedback S1; also shows workouts the webhook brought in. | Only count; only reload on Refresh. |
| 44 | **Triathlon goals = a goal with sport "triathlon"**: the race distance (113 / 226 km), the total as the target, and four new nullable columns (swim, bike, run, transitions). Names: "Half Ironman" / "Ironman". No "faster than your best" rule for the total. | One goals list and table; owner feedback G1. | A separate table; Olympic/sprint distances too (easy to add later). |
| 45 | **Triathlon feedback:** per discipline target vs. best at that distance (with paces); tips for the discipline with the **biggest gap** (pace needed vs. now, weekly volume, workouts), and **running off the bike ≈ 5–10 % slower** than a fresh best. | Owner feedback G1, G3. | Compare with the whole race only. |
| 46 | **Pace beside every time in Goals**, and "You need X instead of Y: Z faster" per km (/100 m for swims, km/h for bikes). | Owner feedback G2, G3. | – |
| 47 | **Bike and swim predictions use Riegel's formula from the strongest effort** (the one predicting the fastest times), like VDOT's best effort for running. | Owner feedback P5; consistent with running. | From the nearest distance. |
| 48 | **Bug fix:** half marathon goals (stored as 21 098 m) never got the "≈ on 5 km" tip and were told to build towards the marathon's 55 km per week instead of 40 km. | Found while checking the demo. | – |

### Things only you can do (batch 4)

- [ ] **Apply the database change** (4 new columns on `goals` for triathlon splits) **before merging**. Without it the goals list still works, but saving a triathlon goal fails. In PowerShell:
  ```
  pnpm exec supabase db push --remote
  ```
- [ ] Commit, push `feat/feedback-2`, merge, and look at Home (1M, 3M, 6M, 1Y, All; phone), Goals (also a new triathlon goal), Profile and Training.

## Batch 2026-11-10 (night): owner feedback ([feedback/2026-11-10.md](feedback/2026-11-10.md))

| # | Decision | Why | Alternatives |
|---|---|---|---|
| 25 | **Up to 3 months = full calendar; longer = a week overview table** with month headers and totals. | 6M/1Y with bars was hard to read ("a lot of poles"); a table makes week-to-week comparison easy. | Stacked month calendars; charts. |
| 26 | **Phone calendar = month grid + tap a day** (workouts and the week's totals below). | Looks like the desktop calendar, fits 375 px. | Horizontal scrolling calendar. |
| 27 | **The weekly average uses the finished week rows shown** (including the days outside the month in those rows), never the current week. | Matches "how many hours a week did I train"; each row is a real week. | Divide the month total by its number of days / 7. |
| 28 | **‹ › always move one month.** | Owner feedback H9. | – |
| 29 | **After connecting Strava, Home waits up to 8 s for the import**; if the history is longer, a spinner card replaces the empty calendar until workouts arrive. | Never an empty calendar (H3). | Always wait for the whole import. |
| 30 | **Database connections:** idle ones are closed after 20 s and a broken one is retried once. | Probable cause of the "events are coming soon" bug after pressing 3M (H11): a serverless function reused a connection the database had already closed. | – |
| 31 | **Best efforts** ([ADR 0013](decisions/0013-exact-efforts-and-power.md)): runs count pauses; Strava's own best efforts for the 3 best runs per distance; power streams for the 6 strongest rides; FTP ≈ 95 % of the best 20 min. | Owner feedback P1–P3, within Strava's rate limits. | Streams for every activity (M7). |
| 32 | **Race predictions** from VDOT (5 km … marathon), shown with your own best. | Owner feedback P4, like Garmin. | Riegel from the longest race. |
| 33 | **Workouts:** a block graph (width = time, height/colour = zone), time and distance, tap to open the steps; +6 bike, +3 swim workouts (placeholders by Claude). | Owner feedback T1–T4. | A separate workout page. |
| 34 | **Landing page = the real app with example data**; the "See an example" link inside the app is gone. | Owner feedback L1, H2. | Screenshots. |

### Things only you can do (feedback batch)

- [ ] **Apply the database change** (new columns on `activities` for power and Strava's best efforts). **Before merging**, otherwise the sync can't store activities. In PowerShell:
  ```
  pnpm exec supabase db push --remote
  ```
- [ ] Push `feat/feedback-calendar`, merge, and look at Home (1M, 3M, 6M; phone), Profile, Training and the landing page.
- [ ] The exact best efforts and power arrive with the next hourly job (or right after pressing Refresh … they need a few hours to be complete).

### Known limits

- ~~Strava is the 6-hour test connection; pages read Strava directly.~~ *Fixed by M3/M4 (2026-11-10).*
- Best efforts are estimates (ADR 0011). Fix any value by hand on the Profile page.

## Batch 2026-11-10 (evening): M3 + M4, speed

| # | Decision | Why | Alternatives |
|---|---|---|---|
| 19 | **Sync without a queue** ([ADR 0012](decisions/0012-strava-sync-v1.md)): import right after connecting, webhook events handled at once, an **hourly** job (Supabase Cron) for a daily full refresh and a quick sync every 3 hours. | Summaries are only ~5 requests per user; a queue is only needed for streams (M7). | Supabase Queues now (ADR 0005); Vercel Cron (only daily on the free plan). |
| 20 | **The webhook verify token is derived from the Strava client secret** (a hash). | No extra secret to manage. | A separate env variable. |
| 21 | **Refresh button on Home** sits in a small line above the calendar ("Synced 5 minutes ago · Refresh"), and in Settings. | Visible where the data is, but quiet. | In the header on every page. |
| 22 | **Disconnect deletes your Strava workouts** but keeps your own best efforts, goals and events. | Strava's terms; your own data is yours. | Delete everything. |
| 23 | **Vercel region Dublin (`dub1`)**, next to Supabase `eu-west-1` (set by you). | Every database round trip stays inside Ireland. | – |
| 24 | The temporary `/strava-test` page and the 6-hour cookie are removed. | Replaced by the real connection. | – |

### Things only you can do (M3/M4)

- [ ] **Apply the database changes** (tables `connections` and `activities`, plus the hourly job). Claude Code's safety check didn't let Claude run it. In PowerShell:
  ```
  pnpm exec supabase db push --remote
  ```
- [ ] Push / merge to `main`, so the new code is live.
- [ ] On the live site: **Connect with Strava once more** (Home or Settings). The import starts by itself.
- [ ] Tell Claude when it's live: Claude then registers Strava's webhook (`node scripts/strava-webhook.mjs create`).

### Things only you can do (M2.5, done)

- [x] **Apply the database changes** *(done 2026-11-10)* (new tables `events`, `goals`, `personal_bests` and the `event-images` bucket). Until then, events, goals and manual best efforts show "not available yet". In PowerShell, in the project folder:
  ```
  pnpm exec supabase login
  pnpm exec supabase link --project-ref <your project ref>
  pnpm exec supabase db push
  ```
  The project ref is in the Supabase dashboard URL (`supabase.com/dashboard/project/<ref>`). `link` asks for the database password (Supabase → Project Settings → Database). `db push` only applies migrations that aren't applied yet.
- [ ] Push the branch, open a PR, and look at the preview.
- [ ] Review the decisions above and the placeholder workouts.
