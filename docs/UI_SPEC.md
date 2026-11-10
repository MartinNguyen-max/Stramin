# Stramin – UI Spec

> **Status:** Draft v0.4 (2026-11-10)
> Screens and navigation for the first release. Requirement IDs refer to [REQUIREMENTS.md](REQUIREMENTS.md).
> Exact visuals (colors, chart styles) are decided during implementation. This doc fixes **what** is on each screen and **how** you get there.

## Navigation

*Decided 2026-11-10 (work mode, see [REVIEW.md](REVIEW.md)).*

- The main sections are **Home, Goals, Training, Profile**. **Settings** sits behind a gear icon in the header.
- **Phone:** a fixed **bottom tab bar** with the four sections (icon + label), like most installed apps. The header only has the logo and the gear.
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
| **Week total** | Total hours in bold ("5:50 h"), a sport bar, then per sport its icon and "time · distance" (time only for strength; swims in km). Counts the whole week, also days outside the period. | HOME-4 |
| **Average week + period total** | First the **average week**: hours per week (large) and workouts per week, then a card per sport with its distance per week and hours per week, and a note that the current week isn't counted. Below a line, the period total: workouts, hours, and per sport time · distance. Under the calendar (≤ 3 months) or above the week overview (longer). | HOME-5 |
| **Density** | Up to 3 months (≤ 15 weeks): the full calendar. Longer: the **week overview**, grouped by month (a week belongs to the month with most of its days): a folding header row per month with its **average week** (hours, distance per sport), then one compact row per week (week number, dates, hours with a sport bar, distance per sport). Weeks that haven't started are hidden. More than 13 months: only the newest month starts open. The month name opens that month. *(Changed after owner feedback 2026-11-10 and 2026-11-11.)* | HOME-7 |
| **Phone** | A month grid (7 days): each day shows its date, sport dots and training time; under each week a strip "Wk 45 · 5:50 h · [icon] 3.2 km · [icon] 119 km …". Tapping a day shows its workouts below the grid. The week overview becomes a folding card per month (average week in the header, two lines per week); from 8 months on, only the newest month starts open. | HOME-9 |
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
| **Goals list** | One card per goal: sport color, "10 km in 40:00", current best and the gap (time and %), a progress bar, the feedback (2–4 short tips, rules in [feedback-rules.md](feedback-rules.md)) and links to matching workouts. "Achieved 🎉" when the best is already at or below the target. | GOAL-1, GOAL-3, GOAL-4, GOAL-6 |
| **New goal** | Sport → distance → shows the current best (with pace) and three suggested targets (≈ 2 %, 5 %, 10 % faster, rounded, with pace) as buttons, or a custom time; the pace of the typed time shows beside the field. Targets slower than the current best are refused. Without a best effort, any target is allowed. **Triathlon:** half or full Ironman → a time per discipline (each with its pace and the best at that distance), optional transitions, and the total. | GOAL-1, GOAL-5 |

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
| **Preferences** | Units · Week start · Language · Indoor/outdoor | SET-1..4 |
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
