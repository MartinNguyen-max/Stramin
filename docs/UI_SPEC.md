# Stramin – UI Spec

> **Status:** Draft v0.3 (2026-11-09)
> Screens and navigation for the first release. Requirement IDs refer to [REQUIREMENTS.md](REQUIREMENTS.md).
> Exact visuals (colors, chart styles) are decided during implementation. This doc fixes **what** is on each screen and **how** you get there.

## Navigation

> **Not decided.** Options include a sidebar or a bottom tab bar. It will be decided later.
> The main sections are: **Home, Activities, Goals, Training, Records, Settings**.
> The wireframes below show **content only**, not the final layout or look.

## Screen map

```
Landing ── Log in / Sign up ── Connect Strava ── Import progress ── Home
                                                                     │
              ┌──────────────┬────────────┬────────────┬──────────┤
          Activities       Goals      Training      Records    Settings
              │              │            │                       │
       Activity detail  Goal detail  Workout detail      Events, Connections,
                                                         Privacy
```

---

## 1. Onboarding

| Screen | Content | Req |
|---|---|---|
| **Landing** | A **preview of the web app**: what Stramin is, plus a look at the real screens (e.g. the weekly overview). Clear **Log in** and **Sign up** buttons. Links to the guide and the privacy policy. | – |
| **Log in / Sign up** | Login buttons (the methods are decided in ARCHITECTURE). | ACC-1 |
| **Connect** | "Connect with Strava" button (Strava's official design). Garmin is shown as "coming soon". | CON-1, NFR-5 |
| **Import progress** | Progress bar ("Imported 412 of ~1,300 activities"). The user can continue to Home while it runs. | CON-3 |

## 2. Home

Top to bottom:

```
┌──────────────────────────────────┐
│ Stramin                 ↻   (●)  │  ↻ = refresh, (●) = settings
├──────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐        │  Event countdowns
│ │ [image]  │ │ [image]  │  →     │  (horizontal scroll)
│ │ Ironman  │ │ CPH Half │        │
│ │ 100 days │ │ 42 days  │        │
│ └──────────┘ └──────────┘        │
├──────────────────────────────────┤
│ This week            8 h 30 min  │  Weekly overview
│ ███████████▓▓▓▓▓▓░░░░▒▒          │  one bar split by sport
│ Swim 1:30  Bike 4:00  Run 2:30   │
│ Strength 0:30                    │
├──────────────────────────────────┤
│ Weeks                            │  Week comparison
│  ▂ ▅ ▃ ▇ ▆ ▄ █ ▅                 │  stacked bars by sport,
│  ←  older           this week →  │  scrollable back in time
├──────────────────────────────────┤
│ Average week   [6 months ▾]      │  Average volume
│ Swim 5.2 km · Bike 120 km        │  period picker
│ Run 35 km · Strength 1:15        │
└──────────────────────────────────┘
```

| Section | Content | Req |
|---|---|---|
| **Header** | Refresh button. Settings icon. | CON-5 |
| **Event countdowns** | A card per upcoming event: image, name, days left. Tap to edit, ⋯ to hide, "+" card to add. Empty state: "Add an event". | HOME-4, EVT-3, EVT-4 |
| **This week** | Total hours and a split by sport, using one color per sport. | HOME-1 |
| **Weeks** | A stacked bar chart, one bar per week. Tapping a week shows its details. | HOME-2 |
| **Average week** | Average distance per sport (hours for strength). The period picker includes "All time". | HOME-3 |

## 3. Activities

Inspired by how Garmin Connect groups activities by week.

```
┌──────────────────────────────────┐
│ Activities          [All sports▾]│
├──────────────────────────────────┤
│ Week 45 · Nov 3–9     8 h 30 min │  week header with
│ Swim 1:30 · Bike 4:00 · Run 2:30 │  totals per sport
├──────────────────────────────────┤
│ 🏃 Sun  Long run    18.2 km 1:32 │
│ 🚴 Sat  Indoor ride 45.0 km 1:30 │
│ 🏊 Fri  Swim         2.5 km 0:48 │
│ ...                              │
├──────────────────────────────────┤
│ Week 44 · Oct 27–Nov 2  ...      │
└──────────────────────────────────┘
```

| Screen | Content | Req |
|---|---|---|
| **Activity list** | Grouped by week, newest first. A week header with totals per sport. Each row: sport icon, day, name, distance, duration. Sport filter. Infinite scroll. | ACT-1, ACT-2 |
| **Activity detail** | Key stats (duration, distance, pace/speed, HR, power, elevation). "View on Strava" link. | ACT-3, ACT-4 |

## 4. Goals

| Screen | Content | Req |
|---|---|---|
| **Goals list** | Cards: "5 km in 15:00". Each card shows the current best and the gap, e.g. "Current 16:20, 1:20 to go". Button "+ New goal". | GOAL-1, GOAL-3 |
| **Goal detail** | Target vs. current best. Progress over time. Feedback hints. Linked event (optional). | GOAL-2..4 |
| **New / edit goal** | Sport, distance, target time, optional event. | GOAL-1 |

## 5. Training

| Screen | Content | Req |
|---|---|---|
| **Workout list** | ~10 running workouts with a name, short description and duration. | TRN-1 |
| **Workout detail** | The steps in order (warm-up → intervals → cool-down) with a personal target pace per step. Without best efforts, it shows "Connect Strava / log a run to see your paces". | TRN-2..4 |

## 6. Records

| Section | Content | Req |
|---|---|---|
| **Sport tabs** | Run · Bike · Swim | – |
| **Best efforts** | Distance, time, pace, date. Tap a row to open the activity on Strava. | BE-1, BE-2, BE-4 |
| **Bike power** | Duration and best watts (Bike tab only). | BE-3 |
| **Indoor/outdoor** | A quick filter (Both / Outdoor / Indoor) for Run and Bike. It defaults to the setting. | SPT-4 |

## 7. Settings

| Section | Content | Req |
|---|---|---|
| **Events** | Create, edit, delete and hide events. Upload images. | EVT-1, EVT-2 |
| **Preferences** | Units · Week start · Language · Indoor/outdoor | SET-1..4 |
| **Connections** | Strava: connected/disconnect. Garmin: coming soon. | SET-5, CON-2 |
| **Privacy** | Export data · Delete account · Privacy policy | PRIV-1, PRIV-2, PRIV-5 |
| **Account** | Log out | ACC-2 |

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
- **Loading states:** skeletons instead of spinners.
- **All text translatable** (English/Danish) from day one.

## Open questions

- [ ] **Navigation pattern** (sidebar, bottom tabs, other) and **Home layout**.
- [ ] Which details of Garmin's weekly activity view should we copy exactly? (To be shown with a screenshot when we build the screen.)
