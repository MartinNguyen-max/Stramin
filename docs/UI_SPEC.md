# Stramin – UI Spec

> **Status:** Draft v0.4 (2026-11-10)
> Screens and navigation for the first release. Requirement IDs refer to [REQUIREMENTS.md](REQUIREMENTS.md).
> Exact visuals (colors, chart styles) are decided during implementation. This doc fixes **what** is on each screen and **how** you get there.

## Navigation

*Decided 2026-11-10 (work mode, see [REVIEW.md](REVIEW.md)).*

- The main sections are **Home, Goals, Training, Profile**. **Settings** sits behind a gear icon in the header.
- **Phone:** a fixed **bottom tab bar** with the four sections (icon + label), like most installed apps: 64 px tall, above the iPhone home bar. The header only has the logo and the gear.
- **Desktop (≥ 768 px):** the four sections are text links in the header. There is no bottom bar.
- **Log out** lives in Settings → Account.

## Screen map

```
Landing ── Log in / Sign up ── Connect Strava ── Home
   │                                              │
 Demo (example data)      ┌───────────┬───────────┼───────────┐
                        Goals      Training     Profile    Settings ⚙
                                                (best      (preferences,
                                                 efforts)   connections,
                                                            account)
```

---

## 1. Onboarding

| Screen | Content | Req |
|---|---|---|
| **Landing** | Sells the app by **showing it** (owner feedback L1): a hero with a phone showing the calendar (desktop), then the real components with example data: calendar, countdowns, running level and power, workouts, a goal; then privacy and a final "Sign up free". "See the demo" opens `/demo`. | – |
| **Log in / Sign up** | "Continue with Google" button (Google's guideline: white with gray border, dark in dark mode, official colored G logo), then email & password. Sign up also asks "What should we call you?". If a saved login exists, Log in shows **"Continue as {name}"** (zone spinner while loading) and **"Use another account"**. No age check. | ACC-1, ACC-3, ACC-5 |
| **Connect** | "Connect with Strava" button (Strava's official design). Garmin is shown as "coming soon". | CON-1, NFR-5 |
| **Import progress** | Progress bar ("Imported 412 of ~1,300 activities"). The user can continue to Home while it runs. | CON-3 |

## 2. Home

Top to bottom: **events**, then the **training calendar**.

### 2.1 Events (HOME-1, EVT)

```
┌────────────────┐ ┌────────────────┐ ┌ ─ ─ ─ ─ ─ ─ ┐
│ [image]      ✎ │ │ [zone colors] ✎│   +  Add event
│ Ironman CPH    │ │ CPH Half       │ └ ─ ─ ─ ─ ─ ─ ┘
│ 16 Aug 2026    │ │ 13 Sep 2026    │
│ 279 days       │ │ 307 days       │
└────────────────┘ └────────────────┘   ← horizontal scroll
```

- One card per upcoming event, sorted by date: background image (or a gradient in the zone colors by type), title, date and the **days left** in large text ("Today!" / "Tomorrow").
- Tap a card (or ✎) to edit; the dialog also has **Delete**. The last card is **+ Add event**.
- The dialog has: title, date, type (Triathlon, Run, Bike, Swim, Other) and an optional background image.
- Empty state: only the "+ Add event" card, with "Add your next race".

### 2.2 Training calendar (HOME-2..10)

Inspired by Garmin Connect's month view (screenshot from the owner, 2026-11-10).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ‹  November 2026  ›   Today            [1M] [3M] [6M] [1Y] [Custom] [All]   │
├────┬───────┬───────┬───────┬───────┬───────┬───────┬───────┬────────────────┤
│ Wk │ Mon   │ Tue   │ Wed   │ Thu   │ Fri   │ Sat   │ Sun   │ Week total     │
├────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼────────────────┤
│ 44 │ 26    │ 27    │ 28    │ 29    │ 30    │ 31    │ 1     │ 9:50 h         │
│    │▌Aarhus│▌Dubai │▌Swim  │▌Mont- │▌Aarhus│▌Styrke│▌Dubai │ ● Run 23.9 km  │
│    │ Løb   │ 67.7km│ 1150m │ lay   │ Løb   │ 1:35  │ 50.9km│ ● Bike 171 km  │
│    │ 13.1km│ 29km/h│ 2:07  │ ...   │ ...   │       │ ...   │ ● Swim 1.2 km  │
│    │ 5:21… │ 2:19  │ /100m │       │       │       │       │ ● Str. 1:35    │
├────┼───────┼───────┼───────┼───────┼───────┼───────┼───────┼────────────────┤
│ 45 │ 2 …                                                    │ …              │
├────┴────────────────────────────────────────────────────────┴────────────────┤
│ November total   ● Swim 4.1 km  ● Bike 330 km  ● Run 52 km  ● Strength 2:18 │
│ 28:50 h in total · 7:10 h per week on average (only for periods > 1 month)  │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Part | Content | Req |
|---|---|---|
| **Period bar** | ‹ › move one month back/forward (also for 3M, 6M, 1Y). The label shows the period ("November 2026", "Sep – Nov 2026"). "Today" jumps back to the current period. The buttons 1M · 3M · 6M · 1Y · Custom · All choose the period type; Custom opens two date fields. The choice is remembered (cookie, per device). | HOME-6, HOME-8 |
| **Week rows** | Week number on the left (ISO week numbers with a Monday start, US numbering with a Sunday start). Each day shows its date; days outside the period are dimmed; today has a ring. The first of a month shows the month name ("1 Dec"). | HOME-2 |
| **Workout chip** | A colored left border (sport color) and a sport icon. **Detailed** (1 month): title, then distance · pace, then time. Run: min/km · Bike: km/h · Swim: min/100 m · Strength/Other: time only. Tapping opens the activity on Strava. | HOME-3, ACT-4 |
| **Week total** | Total hours in bold ("5:50 h"), a sport bar, then per sport its icon and "distance · time" (time only for strength; swims in km). Counts the whole week, also days outside the period. | HOME-4 |
| **Average week + period total** | Titled "Average week for the period": one row of cards (on phones the total on its own line and the sports side by side in one row): grey cards: the hours per week (largest), then per sport its distance per week (a bit smaller, in the sport color) and hours per week, and a note "Based on 2 finished weeks. This week joins the average once it is over." Below a line, "Total for the period" on one compact line: hours, then each trained sport's distance · time. "Total for the period" has no workout count. It counts the same whole weeks as the rows on screen, also their days outside the period, so it always matches the week totals and the average. Always **above** the calendar or week overview (owner feedback 2026-11-12). | HOME-5 |
| **This week** | A separate card between the average box and the calendar, only on **1M** when the current week is shown: "This week · day 3 of 7", the hours so far "of" the average week, a progress bar in sport colors with a mark where the finished weeks usually were by the same day ("Usually by day 3: 3:21 h"), "1:37 h ahead/behind", and each trained sport's distance · time. | HOME-5 |
| **Density** | Up to 3 months (≤ 15 weeks): the full calendar. Longer: a **card per month** (3 per row on desktop, 2 on tablets, 1 on phones): the month, its **average week** in hours (large), then every sport's distance · time per week ("–" without training), and a bar chart with one bar per week (its hours written on top, height = hours on one scale for all months, split into sport colors, week number below; the current week is lighter). A week belongs to the month with most of its days; weeks that haven't started are hidden. Tapping a card opens that month. *(Changed after owner feedback 2026-11-10 and 2026-11-11.)* | HOME-7 |
| **Phone** | A month grid like on PC (owner feedback 2026-11-12): 7 days and a week-total column on the right (hours, then each sport's distance with its icon). Each day shows its date, sport dots and training time; tapping a day shows its workouts below the grid. Longer periods: the month cards stack in one column. | HOME-9 |
| **Loading** | The zone spinner while a new period loads. | – |
| **Sync status** | Above the calendar: while importing, "Importing your Strava history… 412 workouts so far" (the page refreshes itself); afterwards a small "Synced 5 minutes ago · Refresh". After a failed connect, a short message explains why. | CON-3, CON-5 |
| **Not connected** | A card "Connect Strava" (as before), instead of the calendar. | – |

**Sport colors** (unchanged, from the zone colors of the logo): Swim Z1 blue · Bike Z2 green · Run Z5 red · Strength Z3 yellow · Other gray.

## 3. Activities

*Replaced by the Home calendar (2026-11-10).* An activity detail page (ACT-3) may come later; for now every workout links to Strava.

## 4. Goals

```
Goals                                              [+ New goal]
┌ ● Run · 10 km in 40:00 ─────────────────────────────────────┐
│ Current best 41:30 · 1:30 to go (3.6 %)   ███████████░░      │
│ ✓ 40:00 on 10 km ≈ 19:15 on 5 km. Your 5 km (19:40) is a bit │
│   slower → add speed work.                                   │
│ ✓ Your running volume (32 km/week) is good for 10 km.        │
│ Workouts that help: [12 × 400 m] [Cruise intervals]          │
│                                                     Delete   │
└──────────────────────────────────────────────────────────────┘
```

| Screen | Content | Req |
|---|---|---|
| **Goals list** | One card per goal, short and simple (owner feedback 2026-11-12): sport color and "10 km in 40:00"; a small table "Your best / Goal / To go", each with its time and pace (to go: "45 s/km faster"); a progress bar; the **3 most relevant tips as a few words** each, and "Read more" for at most 5 full sentences, from the last 3 months and training principles (rules and scores in [feedback-rules.md](feedback-rules.md) §6); gaps with a unit ("11:57 min"); matching workouts. "Goal reached" when the best is at or below the target. **Triathlon** (minimal, batch 6): a row per discipline with target · pace; then the tips: the time needed when fresh for bike and run ("Run: when fresh, you should manage about 3:03:00 over Marathon (4:20 /km)"; fatigue: bike +3/5 %, run +8/15 % for half/full; the swim comes first, so it has none), and one line per discipline that trains too little: "Over the last 3 months you've swum 2.2 km a week … aim for about 2.6 km" (a step of ~20 %). No predicted times, no "already there", no workouts. | GOAL-1, GOAL-3, GOAL-4, GOAL-6 |
| **New goal** | Sport → distance → shows the current best (with pace) and three suggested targets (≈ 2 %, 5 %, 10 % faster, rounded, with pace) as buttons, or a custom time; the pace of the typed time shows beside the field. Time fields format themselves while typing digits (pairs from the right: "1805" → 18:05, "12930" → 1:29:30), so no colons are needed, and they have no example text (owner feedback 2026-11-12). Times must be plausible: run from just under the world record to 10:00 /km, bike 15–55 km/h, swim 0:55–4:00 /100 m, transitions at most 30:00 ("Enter a time between 12:30 and 50:00"). Danish label: "Ønsket sluttid". Targets slower than the current best are refused. Without a best effort, any target is allowed. **Triathlon:** quarter (1 / 45 / 10.55 km), half or full Ironman → a time per discipline (each with its pace, the best at that distance, and three suggestions around a realistic time: the best there, or a prediction from the other bests; the run +7 % for running off the bike), optional transitions, and the total. | GOAL-1, GOAL-5 |
| **Tabs** | "My goals | Pace calculator" at the top of Goals (`/goals`, `/goals/calculator`); Goals stays active in the menu. | – |
| **Pace calculator** | Its own tab (owner feedback 2026-11-12). Sport: run, bike, swim or triathlon. **Single sport:** the tracked distances or "Other" (own km, swims in m); a slider in the sport's unit (run 2:30–8:00 /km, bike 15–55 km/h, swim 0:55–4:00 /100 m), starting at your own best pace; the finish time large; your best at that distance (or a prediction) with its pace, and the difference in time and in pace in **green** ("9 s faster than your best · 0:02 /km faster") or **red** ("… slower"). **Triathlon:** quarter, half or full; a slider per discipline and for transitions, each leg and the total compared with your bests on race day ("Your best on race day" or, without a best at that distance, "Predicted on race day"), with an ⓘ explaining it (best or prediction, plus the fatigue added). **"Set as goal"** opens the goal form filled in (not for "Other"). | GOAL-7 |

## 5. Training inspiration

```
Training inspiration
[Run] [Bike] [Swim]          [All] [● Z1–Z2 Easy] [● Z3 Moderate] [● Z4–Z5 Hard]
Paces based on your 5 km best (19:40, VDOT 50.6). Change it on your profile.
┌ ● Z5  12 × 400 m ──────────────────────────────┐
│ Short, fast repeats for speed.        ~55 min  │
│ ● Z1  Warm-up 15 min · 5:23/km                 │
│ ● Z5  12 × 400 m · 1:24 (3:30/km)              │
│ ● Z1      200 m easy jog between               │
│ ● Z1  Cool-down 10 min · 5:23/km               │
└────────────────────────────────────────────────┘
```

| Screen | Content | Req |
|---|---|---|
| **Catalog** | Sport tabs and effort chips (zone colors), saved in the URL. A card per workout: name, short description, duration, and the steps with zone dot and personal pace. | TRN-1..5 |
| **No best effort** | Steps without paces, and a note: "Add a best effort on your profile to see your paces". | TRN-4 |

## 6. Profile

```
Profile
(M) Martin · martin@…
Best efforts            (one card per sport: Run · Bike · Swim)
 Distance   Time      Pace       Date         Source
 5 km       19:40     3:56/km    12 Oct 2026  Strava ↗        ✎
 10 km      41:30     4:09/km    3 Sep 2026   Manual          ✎ ↺
 …
Your running level: VDOT 50.6
 Easy 4:56–5:28/km · Marathon 4:24 · Threshold 4:08 · Interval 3:48 · Repetition 3:34
```

| Section | Content | Req |
|---|---|---|
| **Header** | Name and email. | ACC-5 |
| **Best efforts** | One card per sport (side by side on desktop, stacked on phones). Distance, time, pace (speed for bike), date and source: "Strava" (estimate, links to the activity) or "Manual". ✎ edits the time (and optionally the date); ↺ resets to the Strava value. Missing values show "–" and can be added by hand. | BE-2, BE-4, BE-6, BE-7 |
| **Running level** | VDOT and the five training paces, from the best running effort. Hidden without running efforts. | TRN-3 |

## 7. Settings

| Section | Content | Req |
|---|---|---|
| **Preferences** | Units · Week start · Language · Indoor/outdoor · **Theme** (Device / Light / Dark, applied at once, saved on the device) | SET-1..4 |
| **Connections** | Strava: "Connect with Strava" (orange), or "Connected as {name}", last sync, **Refresh** and **Disconnect** (asks once more; deletes the Strava workouts). Garmin: coming soon. | SET-5, CON-2, CON-5 |
| **Privacy** | Export data · Delete account · Privacy policy | PRIV-1, PRIV-2, PRIV-5 |
| **Account** | Name · Log out | ACC-5, ACC-2 |

---

## Brand

- **Logo:** the heart-rate gauge icon followed by the "stramin" wordmark (Rubik Black) with the five zone bars. The component is `src/components/brand/logo.tsx`.
- **Logo files** (`public/brand/`): the **light** version is the **official** logo, and the dark version is for dark backgrounds.
  - `stramin-logo-light-300.png` / `-dark-300.png`: the full logo as PNG (300 × 95). Use it wherever an image URL is needed (e.g. Garmin).
  - `stramin-logo-*.svg`: the full logo as SVG.
  - `stramin-icon-*.svg` and `stramin-text-*.svg`: the icon and the wordmark separately (extras).
  - Note: the SVGs load the Rubik font from Google, which browsers block when an SVG is used as an image. Use the PNGs for external use.
- **Colors:** a neutral UI (ink `#14141A` / white) with the five **heart-rate zone colors** as accents and chart colors: Z1 `#4FC3F7` · Z2 `#3DDC84` · Z3 `#FFD54F` · Z4 `#FF8A3D` · Z5 `#FF3D5A`. Defined as tokens in `src/app/globals.css` (`bg-zone-1` … `bg-zone-5`).
- **Style:** clean and simple for now. The full visual design comes later.

## Global UI rules

- **Sport colors:** one fixed color per sport (Swim, Bike, Run, Strength, Other), used everywhere.
- **Dark and light mode**, following the system setting.
- **Empty states:** every screen explains what to do when there is no data yet.
- **Loading states:** the **zone spinner** (`src/components/brand/zone-spinner.tsx`): the logo gauge with the needle sweeping from zone 1 to zone 5. Still image when the OS has "reduce motion" on.
- **All text translatable** (English/Danish) from day one.

## Open questions

- [x] **Navigation pattern** and **Home layout**: decided 2026-11-10 (see above, to be reviewed by the owner).
- [x] Garmin's month view: shown by the owner with a screenshot (2026-11-10); the calendar follows it.
- [ ] A sport filter on the calendar (ACT-2).

## Added 2026-11-12 (owner feedback)

| Element | What it shows | Req |
|---|---|---|
| **Profile: level card** | "Your level and predicted times": three columns (run from VDOT, bike and swim with Riegel), each with its distances, predicted time and pace, "your best" when there is one, and what it's based on; VDOT in the running column's header, with "VDOT from Jack Daniels' Running Formula (running only)"; bike and swim "Riegel's formula"; "Running training paces" folds open. | BE-9, TRN-3 |
| **Profile: progress** | "Your progress": 3 mo / 6 mo / 1 yr; "you now compared with you on 12 May 2026"; a legend (grey = then, color = now); per row (total hours, each sport's weekly distance, 12-week averages) two bars with values and ▲/▼ % in green/red; best efforts that changed as "1:51:20 → 1:50:53" with a green/red pill ("27 s faster") or "new", and "9 other distances unchanged". From Strava activities only. | – |
| **Onboarding** | The first time on Home: a dialog with 4 steps (welcome, calendar, goals and calculator, profile), dots, "Skip" and "Next"/"Get started". Never again after closing. | – |
| **Loading** | Skeleton loading: grey boxes in the shape of the page (pulsing, still with "reduce motion") with the zone spinner on a small card on top (`src/components/page-skeleton.tsx`). | NFR |
| **Install (PWA)** | Add to home screen: the light Stramin icon (always; the browser tab icon follows the theme), opens full screen at Home; without a connection an offline page ("You're offline", try again). | M11 |
| **Landing** | Short (owner, 2026-11-12): the hero shows the real Home (greeting, countdown cards, average week, calendar) in a browser window with the phone in front (only the phone on phones); then "Stramin in 30 seconds" (a video with a poster; the voiced MP4 when it exists, else the silent recording, see [video-script.md](video-script.md)); then privacy and "Sign up free". | L1, L2 |
| **Event image** | In the event dialog the image shows in the card's shape; drag it (or use the arrow keys) to choose which part shows. Saved with the event. | EVT-2 |
