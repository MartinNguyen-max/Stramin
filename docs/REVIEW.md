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

### Known limits (until M3/M4)

- Strava is still the 6-hour test connection. After 6 hours you must press "Connect Strava" again.
- Profile, Goals and Training read your **full** Strava history on each visit (about 5 requests for ~860 activities); Home only reads the shown period. Strava allows 100 requests per 15 minutes, so many reloads in a row could hit the limit. The sync engine (M4) fixes this.
- Best efforts are estimates (ADR 0011). Fix any value by hand on the Profile page.

### Things only you can do

- [ ] **Apply the database changes** (new tables `events`, `goals`, `personal_bests` and the `event-images` bucket). Until then, events, goals and manual best efforts show "not available yet". In PowerShell, in the project folder:
  ```
  pnpm exec supabase login
  pnpm exec supabase link --project-ref <your project ref>
  pnpm exec supabase db push
  ```
  The project ref is in the Supabase dashboard URL (`supabase.com/dashboard/project/<ref>`). `link` asks for the database password (Supabase → Project Settings → Database). `db push` only applies migrations that aren't applied yet.
- [ ] Push the branch, open a PR, and look at the preview.
- [ ] Review the decisions above and the placeholder workouts.
