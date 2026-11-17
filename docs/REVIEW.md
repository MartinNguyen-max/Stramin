# To review with the owner

> Decisions Claude made in **work mode** while the owner was away (CLAUDE.md → Work mode).
> Each one can be discussed and changed. When a point is settled, move it out of this list (or delete it).

## Batch 9 – 2026-11-17: weekly goal, "This week" against it, bike in % of FTP

| # | Decision | Why | Alternatives |
|---|---|---|---|
| 98 | **Weekly goal = a third Goals tab** (`/goals/weekly`): hours per week, and per sport (swim, bike, run) **None · km · Time**. **Everything is optional**, also the hours; an empty form deletes the goal. Hours can be typed as "8", "7.5", "7,5" or "7:30". Limits: at most 40 h a week; swim ≤ 50 km, bike ≤ 2000 km, run ≤ 300 km. | Owner request; optional so a goal for just running is possible. | Hours required; a slider. |
| 99 | **Stored in its own table `weekly_goals`** (one row per user, a column per sport and unit, a check that a sport has a distance *or* a time). | Clear columns, RLS like the other tables. | Columns on `profiles`; one JSON column. |
| 100 | **"This week" compares with the goal where set, else with the average week** of the shown period, per number: the hours with the hours goal, each sport with its own goal. With a goal, the mark on the bar is the goal **spread evenly over the 7 days** ("Goal by day 3: 3:26 h"). | Owner: "maybe set your own goal for what you want to hit per week". | Always the average; a goal mark by your usual training days. |
| 101 | **The info box is an ⓘ button in the top-right corner** that opens the text on tap (and closes on tap outside / Escape), with a link to the weekly goal. Two texts: "compared with your average week in the period you chose…" or "compared with your weekly goal…". It sits **outside** the folding header, so tapping it doesn't fold the card. | Small, works on phones (no hover); always visible, also when the card is folded. | A text line always shown in the card (takes space). |
| 102 | *(Owner, changed the same day: the first version with a row and bar per sport was too big)* **"This week" stays compact:** the line with what's done ("[icon] 56.3 km · 1:44 h …") as before, and **one small line under it**, always (with or without a goal): per sport "mangler 16.1 km", "✓ mål nået" or "over gns.". Distance sports count km unless their goal is a time; strength/other count time. Shown when the card is open. | Owner: "what you have done in a week on one line, and one line below". | Show the line also when folded. |
| 103 | *(Owner: simpler and cleaner)* **Bike steps show only "% FTP"** ("56–75 % FTP"); the FTP in watts is shown **once** above the cards ("Din FTP: 268 W"). Classic power zones mapped on our 5 zones (Z1 < 55 %, Z2 56–75 %, Z3 76–90 %, Z4 91–105 %, Z5 106–120 %). FTP = 95 % of the best 20-minute power (as on Profile). Without power data: "Ingen FTP endnu". Sprints (Z5) also show 106–120 %, although they're really "all out". | Owner: "show it in FTP, that's what you normally train by". | Heart rate (before); a manual FTP field (could come later, e.g. on Profile). |
| 104 | **Demo:** an example weekly goal (8 h, run 30 km, swim 1:30 h, bike left to the average), read-only on the demo's Weekly goal tab and used by the demo Home. | Shows both cases (goal and average) at once. | No goal in the demo. |

### Things only you can do (batch 9)

- [ ] **Apply the database change** (new table `weekly_goals`). Without it, Home and the rest work (compared with the average), but the Weekly goal tab says "not available yet". In PowerShell:
  ```
  pnpm exec supabase db push --remote
  ```
- [ ] Commit, push and look at Home (the ⓘ, the sport lines), Goals → Weekly goal (save one, then Home again) and Training → Bike (steps).

## Batch 8 – 2026-11-15: "This week" folds, create workouts, favorites

| # | Decision | Why | Alternatives |
|---|---|---|---|
| 90 | *(Owner, replaces #73 "only on 1M")* **"This week" on every period that contains today** (1M, 3M, 6M, 1Y, All, custom). Past months (‹) have no current week, so no card there. | That's the only week it can describe. | Show this week also on past periods (needs an extra query). |
| 91 | **"This week" folds; the header with the hours stays visible.** Open by default on 1M/3M, closed on 6M/1Y/All/custom. The choice is remembered **per period type**, per device (cookie `stramin-this-week`), so it renders right on the first load. Unlike other sections (#78) it does **not** close when you leave the page, because closing would overwrite your choice. | Owner request; the closed card still says the most important number. | One choice for all periods; store in the database. |
| 92 | **Training = three tabs: Classics · Create · Favorites**, everything in the URL. | Keeps the classics simple; back button and links work. | Create as a dialog; a separate page. |
| 93 | **Create: three steps that appear one after the other** (sport → duration → effort), chips instead of a slider. Durations from **30 min** (15 min is too short for warm-up + work), every 15 min to 2:30 h, then every 30 min to 5:30 h. **Swims stop at 2 h.** | Big tap targets on phones; owner's steps. | A slider; 15 min sessions. |
| 94 | **Efforts: easy, moderate, hard and "Mixed · Z2–Z5"** (tempo + hard parts in one session). | Owner: "a mix if it makes sense": it does for long sessions. | Only the three. |
| 95 | **18 templates** (4 easy, 5 moderate, 5 hard, 4 mixed) fill exactly the chosen time: warm-up, the main part, **easy endurance for the rest**, cool-down. The hard part has a maximum (e.g. 6 × 8 min threshold), so a 5:30 h ride is a long ride with intervals, not 5 h of intervals. 3–5 suggestions per choice (3 only for some 30 min sessions). Swims are converted to meters with your swim pace. **Written by Claude** (common sessions); please review. | Realistic sessions at every length. | AI-generated workouts; fixed workouts per length. |
| 96 | **Favorites in the database** (`favorite_workouts`: user, workout id, date; RLS). Only the **id** is stored ("intervals-400", "run.vo2.60"); the workout is rebuilt with your current paces. | Same on phone and PC; small; your paces stay up to date. If a template changes later, its favorites change with it. | Store the whole workout (snapshot); browser storage. |
| 97 | **The star is on every card** (classics, suggestions, favorites), changes at once and goes back if saving fails. **Every card shows its sport icon** in a tinted circle. Demo: no stars. | Owner request. | Star only on created workouts. |

### Things only you can do (batch 8)

- [ ] **Apply the database change** (new table `favorite_workouts`). Without it the Training page works, but stars are hidden and Favorites says "not available yet". In PowerShell:
  ```
  pnpm exec supabase db push --remote
  ```
- [ ] Commit, push, and look at Home (1M open, 6M closed; open/close and reload) and Training (Create, star a few, Favorites).
- [ ] Review the templates (#95).

## Batch 2026-11-12 (batch 7): triathlon tip and performance

| # | Decision | Why | Alternatives |
|---|---|---|---|
| 81 | *(Owner)* **The fresh time per leg is a tip**, first under the legs ("Cykel: udhvilet skal du kunne klare ca. 4:45:43 på 180 km (37,8 km/t)"), for bike and run; the leg rows only show target · pace. | Owner request. | – |
| 82 | **Page reads in parallel** (`Promise.all`) on Home, Goals, calculator, Training and Profile. | Each read waited for the one before (profile → goals → Strava status → workouts). | One combined database transaction per page (more code, small extra gain). |
| 83 | **30 s browser cache for pages** (`staleTimes.dynamic: 30`): switching back to a tab within 30 s needs no server call. Saving settings now calls `refresh()`. | Every tab switch asked the server again (measured on the demo). | No cache (before); 5 minutes (stale Strava data). *A sync in the background shows up within 30 s.* |
| 84 | **Smaller JavaScript:** zod and the Supabase browser client no longer ship with every page (–32 %, 1.18 → 0.8 MB uncompressed). | Faster first load on phones. | – |
| 86 | *(Owner)* **Browser tab icon follows the theme** (light icon, the dark one in dark mode, one SVG with a media query); the **home screen icons stay light**. Changed by #88: it now follows the theme chosen in Settings. | iOS can't switch a web app's home screen icon by theme; the owner wants it light. | – |
| 87 | *(Owner)* **Skeleton loading with the spinner on top:** while a page loads, grey boxes in its shape (Home, Goals, calculator, Training, Profile, also the demo) pulse softly, and the zone spinner sits on a small card above them. | The layout shows at once; the owner keeps the spinner. | Skeleton only; spinner only (before). |
| 88 | *(Owner)* **Theme switch in Settings:** Device / Light / Dark, applied at once, saved on this device (next-themes, localStorage). The browser tab icon follows the chosen theme; the home screen icon stays light. | "A button to switch between dark and light." | Saved in the profile (same theme on every device; needs a migration). |
| 89 | *(Owner)* **Settings apply at once, no Save button:** units, week start, language and theme as pill buttons (label left, choices right; stacked on phones). Units and week start are saved right away (a "Saved ✓" line; on failure the old value comes back). The language is saved (the action also sets next-intl's language cookie), then the whole app reloads in it with the zone spinner ("Switching language…"), so every part changes; the button always shows the page's own language (`useLocale`). The form starts fresh when Next.js shows a kept page again (it showed "Dansk" on an English page). | "Changing language and units doesn't work; no saving, just change instantly." | Auto-submitting the old form. |
| 85 | **Not done (yet): best efforts stored in the database** at sync time. | Needs a migration, hooks in 8 sync paths and the 7-day rule (ADR 0009); the gain can't be measured without production data. Proposed as the next step if Profile/Goals still feel slow. | Do it now. |

## Batch 2026-11-12 (batch 6): owner feedback from the installed app ([feedback/2026-11-12-batch6.md](feedback/2026-11-12-batch6.md))

| # | Decision | Why | Alternatives |
|---|---|---|---|
| 72 | **Light app icon** everywhere it's installed (home screen 192/512, maskable, Apple 180, favicon): white background, dark needle, the light logo. Splash background white; service worker cache bumped to v2. *iPhone: remove and re-add the home screen app to see the new icon.* | Owner: "it should have been the light logo". | Follow the phone's theme (not possible for home screen icons). |
| 73 | ~~**"This week" card only on 1M.**~~ *Replaced by #90–91 (2026-11-15).* | Owner request. | – |
| 74 | *(Owner, changed 2026-11-12)* **Triathlon goal card, minimal:** per leg the target and its pace; the time needed **fresh** over that distance is the first tip under the legs ("Bike: when fresh, you should manage about 4:45:43 over 180 km (37.8 km/h)"), for bike and run (the swim comes first, no fatigue). Gone: best / predicted race-day times, "Already there", "to go", the fatigue note, the scored tips and the workout chips. | A predicted time said "already reached" for a 3.8 km swim never done. "Keep it minimal". | Keep the race-day comparison but only for real bests. |
| 75 | **Triathlon volume line per discipline, a realistic next step:** "Over the last 3 months you've swum 2.2 km a week … aim for about 2.6 km": +20 % on what you do now (at least 40 % of the target, at most the target), only for disciplines under 85 % of the target. Targets lowered for amateurs: full 6 km swim / 180 km bike / 40 km run a week; half 4.5 / 130 / 30; quarter 3 / 80 / 25. | "9 km swim per week is not good"; the owner liked "you did X, try Y". | The full target at once (before); +10 % (feels like no change). |
| 76 | **Calculator: the pace difference** next to the time difference ("9 s slower · 0:02 /km slower"; bike in km/h, swim per 100 m), and the reference's pace ("Your best: 20:41 · 4:08 /km"). | Owner request. | Only the pace. |
| 77 | **Calculator, triathlon: "Your best on race day" vs "Predicted on race day"**, with an ⓘ that explains it: the best over that distance (or "no best yet, we use your predicted time … less accurate") plus the fatigue added (+5 % bike / +15 % run in a full). | The user must see when a number is only a prediction. | A warning color; hide predicted legs. |
| 78 | **Opened sections close when you leave a page** (Read more, Show steps, training paces, the calculator's ⓘ): a small `Details` component that closes on hide. Sliders and chosen distances are kept. | Next.js (Cache Components) keeps the last pages alive, so opened things stayed open. The Next docs recommend this per-element reset. | Reset whole pages on every navigation (`bfcacheId`): also resets the calculator. |
| 79 | **Phone tab bar bigger and higher:** 64 px tall, bigger icons and labels, above the iPhone home bar (`viewport-fit=cover` so the safe area is known, plus at least 8 px). | "Hard to hit" in the installed app. | A floating pill bar. |
| 80 | **Average week on the phone:** total on its own line, the 4 sport cards in one row (icon, name, distance, hours), like on PC. "Skøn" → **"Strava · anslået"** with a hover text: the time is Stramin's estimate from the Strava activity, not Strava's exact best effort. | Owner feedback. | 2 × 2 grid (before). |

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
| 37 | **The average week is the main block**, the period total a line below it. It sits **above** the calendar for every period *(owner, 2026-11-12: one place for all periods; the "workouts per week" text is gone)*. | Owner feedback C2. | Always below. |
| 38 | **Week overview grouped by month: a week belongs to the month with most of its days** (its 4th day); weeks at the edges go to the first/last month shown. Each month's average uses its finished weeks. Weeks that haven't started are hidden. | Every week is under exactly one month, and the month's average is a real "average week". | Split weeks across months; average = month total ÷ days × 7. |
| 39 | ~~**Week rows show hours + distance per sport**~~ *Replaced by month cards (#50).* (time only for strength); per-sport time is in the tooltip. | Owner feedback C3: "total hours and total distance in each"; one line per week keeps it compact. | Time and distance per sport (two lines). |
| 40 | ~~**Months fold** (tap the header).~~ *Replaced by month cards (#50).* Open by default: desktop up to 13 months, phone up to 7; longer periods only open the newest month, so all time (and 1Y on the phone) becomes a list of month averages. | Owner feedback C4, M2 (long scroll). | Year groups; always open. |
| 41 | **Phone calendar: a strip under every week** with hours and distance per sport (sport icons), instead of the Σ column; the day panel only lists the day's workouts. | Owner feedback M1: distance per week is needed and the Σ column had no room. | Tap the Σ cell for a week panel; horizontal scroll. |
| 42 | **Sport icons in their colors** (waves, bike, shoe, dumbbell) in all totals instead of colored dots. | Owner feedback M2 ("is green the bike?"). | A legend. |
| 43 | **"Synced … ago" counts on every 30 s**, and the page reloads its data every 5 minutes while visible and when the tab is opened again. | Owner feedback S1; also shows workouts the webhook brought in. | Only count; only reload on Refresh. |
| 44 | **Triathlon goals = a goal with sport "triathlon"**: the race distance (113 / 226 km), the total as the target, and four new nullable columns (swim, bike, run, transitions). Names: "Half Ironman" / "Ironman". No "faster than your best" rule for the total. | One goals list and table; owner feedback G1. | A separate table; Olympic/sprint distances too (easy to add later). |
| 45 | **Triathlon feedback:** per discipline target vs. best at that distance (with paces); tips for the discipline with the **biggest gap** (pace needed vs. now, weekly volume, workouts), and **running off the bike ≈ 5–10 % slower** than a fresh best. | Owner feedback G1, G3. | Compare with the whole race only. |
| 46 | **Pace beside every time in Goals**, and "You need X instead of Y: Z faster" per km (/100 m for swims, km/h for bikes). | Owner feedback G2, G3. | – |
| 47 | **Bike and swim predictions use Riegel's formula from the strongest effort** (the one predicting the fastest times), like VDOT's best effort for running. | Owner feedback P5; consistent with running. | From the nearest distance. |
| 48 | **Bug fix:** half marathon goals (stored as 21 098 m) never got the "≈ on 5 km" tip and were told to build towards the marathon's 55 km per week instead of 40 km. | Found while checking the demo. | – |
| 49 | *(Owner, 2026-11-12)* **The total counts the same whole weeks as the rows shown** (also their days outside the period), and keeps the label "Total for the period"; sports show distance before time, like the average week. | Before, the total only counted days inside the period while the average used whole weeks, so strength showed 44 min in total but 1:09 h per week. | The average only from days inside the period; a note. |

| 50 | *(Owner, 2026-11-12)* **6M, 1Y and All: a card per month** instead of the week table: average week (hours, every sport) and a bar per week on one shared scale. No folding. | The table was hard to read; cards show months and weeks at a glance and work on phones. | A chart + table; months side by side; small heatmap calendars. |
| 51 | *(Owner, 2026-11-12)* **Averages use finished weeks; the current week is shown on its own** ("This week so far (day 3 of 7)") in the average box. Month cards: finished weeks too. | First tried "days so far" (the current week as 2/7 of a week): correct, but with heavy weekends it dipped every Monday, and a short session today could lower it. Finished weeks are stable; this week is still visible right away in its own card (a progress bar toward the average week, "ahead/behind" compared with the **same days** of the finished weeks (so heavy weekends don't make Mondays look low). | Days so far; project the week to 7 days; compare with avg × day/7. |
| 52 | *(Owner, 2026-11-12)* **Plausible goal times**: run from just under the world record to 10:00 /km; bike 15–55 km/h; swim 0:55–4:00 /100 m; transitions ≤ 30:00. Checked in the form and on the server. | "Nobody runs 5 km in 10 minutes or sets 5 km in an hour", but everyone must be able to use the app. | Per-level limits from the user's own bests. |
| 53 | **Triathlon leg suggestions**: 3 % faster, the realistic time, 5 % slower; the realistic time is the race-day time (#54) of the best at that distance, else of a prediction (VDOT / Riegel). | Owner feedback: suggestions for swim, bike and run, counting the fatigue. Single-sport suggestions are faster than the best, but a leg after swimming/biking usually can't be. | 2/5/10 % faster like single goals. |
| 54 | *(Owner, 2026-11-12)* **Triathlon legs count the fatigue of race day**: a best is worth more time on race day: swim ±0 %, bike +3 % (half) / +5 % (full), run +8 % / +15 %. "Already there" only when the race-day time is at or under the target; the tip says the fresh time needed (3:30 Ironman marathon ≈ 3:03 fresh). | "My best marathon is 3:27, but not after swimming and cycling." | Fixed 5–10 % for all; the user sets the factors. *Rough estimates; easy to tune.* |
| 55 | *(Owner, 2026-11-12)* **Single goal cards are short**: best / goal / to go with paces, one abstract focus line, workouts. The long tips (status, in-between goal, equivalent times, volume numbers) are gone. | "Too much wording … I don't want to say anything wrong to them." | Keep the tips behind a "more" toggle. |
| 56 | *(Owner, 2026-11-12)* **Form errors show after "Set goal"** and disappear as soon as anything changes; switching sport or race empties the times. | An old message stayed while changing sport; live errors would complain while typing "1". | Live validation. |
| 57 | *(Owner, 2026-11-12)* **Scored tips: the 3 most relevant as a few words, "Read more" opens at most 5 full sentences.** Built from the last 3 months (12 weeks): comeback after a break, weekly distance against a target that grows with the goal's level, trend, long session, frequency, consistency, speed or endurance first, a key session per distance with the user's paces, fuel, open water, technique, step size, 80/20, recovery weeks; triathlon: most to gain, per-discipline volume, nutrition, bricks. Rules and scores in feedback-rules.md §6. | "Two running goals looked the same"; "only 1–3 good, relevant and specific tips, and more on demand". The numbers are common guidelines, worded softly ("about", "try"). | A fixed list; a full training plan. |
| 58 | *(Owner, 2026-11-12)* **Phone calendar: the week total is back on the right** (hours + distance per sport with icons), like on PC; the line under each week is gone. | "The mobile version should look as much as the PC version as possible." | The line under each week (#41). |
| 59 | *(Owner, 2026-11-12)* **Quarter Ironman**: 1 km swim, 45 km bike, 10.55 km run; race day +2 % bike, +5 % run; volume 4 / 100 / 25 km a week. Legs without a best at that exact distance use a predicted time ("Predicted 1:20:00 ≈ …"). No database change. | Owner request; 45 km and 10.55 km aren't tracked best-effort distances. | Olympic distance (1.5/40/10) instead. |
| 60 | *(Owner, 2026-11-12)* **Pace calculator as a tab of Goals** ("My goals | Pace calculator"), for all sports and triathlon, compared with your bests (green faster / red slower; triathlon against race day), with "Set as goal". | A separate tool from setting a goal, but linked to it; keeps the main menu at 4 items. | Its own menu item; at the top of the goal form. |
| 61 | *(Owner, 2026-11-12)* **Profile: one card "Your level and predicted times"** with run (VDOT), bike and swim (Riegel) side by side; VDOT at the top; the running training paces fold open. | The two prediction cards sat apart; training paces matter less. | Tabs per sport; paces always open. |
| 62 | *(Owner, 2026-11-12)* **"Your progress" on Profile**: you now vs. you 3, 6 or 12 months ago (the same date back). Weekly training (12-week average) per sport and in hours, and best efforts that changed (green better, red worse; "new"); unchanged ones are counted, not listed. From the Strava history only, so both sides are measured the same way. | Owner idea; Profile is where the level lives. | Its own page; charts over time. |
| 63 | **Bike: speed first, watts when known.** Bike tips give watts (2 × 20 min at 95–100 % FTP; long rides at 56–75 %) when there's an FTP from power data, and speed otherwise; goals, predictions and the calculator stay in speed. | The owner rides outside without power; indoor riders have watts. | Watts everywhere. |
| 64 | **PWA:** manifest (start at Home, standalone, dark theme color), app icons from the logo (192, 512, maskable, Apple 180), and a small service worker (production only) that serves an offline page when a page can't load. Pages and data always come from the network. No push notifications. | Install on the phone like an app (M11). | Offline caching of pages and data (stale training data). |
| 65 | **Onboarding:** 4 short steps (welcome/Strava, calendar, goals and calculator, profile) the first time someone opens Home; skip or finish marks it as seen on the login (Supabase user metadata), so it shows once per person on any device, with no database change. Existing accounts see it once too. | Owner request. | A database column; a guided tour on the real screens. |
| 66 | *(Owner, 2026-11-12, changed)* **Landing page = Home + a video.** The hero shows the real Home (greeting, countdown cards, average week, calendar) on PC with the phone in front (only the phone on phones); then a 30-second video; then privacy and "Sign up free". The other sections are gone. | "Too long; the calendar showed twice; countdowns aren't the most important." | Feature sections (before). |
| 67 | **Strength text in a darker yellow** (amber-600; the zone yellow in dark mode). | The zone-3 yellow was hard to read on light grey. | – |
| 68 | **Level card: VDOT sits in the running column** ("VDOT 47.9" in its header, "VDOT from Jack Daniels' Running Formula (running only)" under it); bike and swim say "Riegel's formula". | "VDOT is only for running; people should see that." | A note for the whole card. |
| 69 | **Progress, more visual:** a legend (grey = then, color = now), two bars per row (total hours and each sport's weekly distance) with ▲/▼ % change, and best efforts as "1:51:20 → 1:50:53" with a green or red pill. | "Very hard to understand." | Line charts over time. |
| 70 | **Event images can be moved:** drag the image in the dialog (a preview the shape of the card; arrow keys too). Stored as `image_x` / `image_y` (0–100 %, CSS object-position) on `events`. | "Sometimes my picture doesn't fit." | Crop and re-upload; zoom too. |
| 71 | **The video:** Claude records the silent 30-second tour from the demo (Playwright) and writes the voice-over; the owner adds the voice in Clipchamp (Danish text-to-speech or own voice) and exports `stramin.mp4`. The page plays the MP4 when it exists, else the silent webm. | No natural Danish voice or video editor on this machine; a different model wouldn't change that. | A paid AI video/voice service. |

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
