# Goal feedback rules (GOAL-4..6)

> **Changed 2026-11-12 (owner feedback):** the card shows the rules below as **one** short, abstract line, not as several tips: the speed check decides "You have the distance. Now build speed." or "You have the speed. Now build endurance."; without it, the volume check decides between that speed line and "Build up your weekly distance." The status, in-between goal and equivalent-time texts are no longer shown. Triathlon legs compare the target with the best **on race day** (`RACE_DAY_FACTOR` in `src/features/goals/triathlon.ts`).

> **Status:** v1 (2026-11-10), written in work mode, to be reviewed by the owner.
> Simple, explainable rules. No AI. Implemented in `src/features/goals/feedback.ts` (unit tested).

A goal is a sport, a distance `D` and a target time `T`. The user's current best at `D` is `B` (manual value or estimate, ADR 0011).

## 1. Suggested targets (GOAL-5)

- With a best `B`: suggest **2 %, 5 % and 10 % faster** than `B`, rounded to a "nice" time:
  - under 30 min → nearest 5 s · under 2 h → nearest 15 s · otherwise → nearest minute.
  - If rounding makes a suggestion not faster than `B`, it moves one step faster.
- A target **slower than or equal to `B`** is refused: "You already did {B}. Pick a faster time."
- Without a best: no suggestions, any target is allowed.

## 2. Status and gap (GOAL-3)

- **Achieved** when `B ≤ T`: "Goal reached! Time for a new one."
- Otherwise the gap is `B − T` and `(B − T) / B`:
  - **≤ 3 %:** "Close. A few focused weeks can do it."
  - **3–8 %:** "Realistic in a season (8–16 weeks of steady training)."
  - **> 8 %:** "A big step. Consider an in-between goal of {B × 0.96}."

## 3. Speed check: equivalent performance (running only, GOAL-6)

Uses VDOT race equivalents (ADR 0010). The **reference distance** `S` is the next shorter standard distance: 1 km for 5 km, 5 km for 10 km, half marathon and marathon. (For a 1 km goal there is no speed check.)

- Needed at `S`: `Teq = equivalent(T at D → S)`. Always shown: "{T} on {D} ≈ {Teq} on {S}."
- If the user has a best at `S`, `BS`:
  - `BS > Teq × 1.01` → **speed is the limiter:** "Your {S} ({BS}) is slower than that. Work on speed." → suggest **Z4–Z5** workouts.
  - otherwise → **endurance is the limiter:** "Your {S} ({BS}) already supports this goal. Focus on holding the pace for longer." → suggest **Z3** workouts and the **long run**.

## 4. Volume check (all sports)

Average weekly distance of the sport over the **last 8 finished weeks**.

| Goal distance | Recommended weekly volume |
|---|---|
| Run ≤ 5 km | 20 km |
| Run 10 km | 30 km |
| Run half marathon | 40 km |
| Run marathon | 55 km |
| Bike ≤ 40 km | 80 km |
| Bike 90 km | 150 km |
| Bike 180 km | 200 km |
| Swim ≤ 1 km | 4 km |
| Swim 1.9 km | 6 km |
| Swim 3.8 km | 8 km |

- Volume **below 80 %** of the recommendation → "You average {X} per week. Build towards {Y}, adding at most 10 % per week." → suggest **Z1–Z2** workouts.
- Otherwise → "Your volume ({X} per week) is good for this distance. Add one quality session per week." → suggest **Z4–Z5** workouts (if the speed check didn't already suggest something).
- Without Strava data: the volume check is skipped.

## 5. Workout suggestions

Up to 3 workouts from the training catalog of the same sport, from the effort group(s) chosen above, in the order speed → endurance → volume.

## Notes

- The numbers are rules of thumb from common training literature (Daniels, Pfitzinger), deliberately rounded.
- Feedback is short: at most 4 lines per goal.

## 6. Tips on the card (owner feedback 2026-11-12)

Every tip gets a **score** from the user's own data (lower = more relevant). The card shows the **best 3 as a few words** each ("Speed first", "Run more: about 50 km a week"); **"Read more"** opens **at most 5** as full sentences (owner, 2026-11-12: "we shouldn't decide too much for them"). Each kind of tip shows once. "3 months" = the last 12 finished weeks; "recent" = the last 4. Code: `src/features/goals/tips.ts`.

| Score | Tip | When | Example |
|---|---|---|---|
| 0 | Comeback | No session in the sport for 14+ days | "You haven't run for 20 days. Start easy and build up over 2–3 weeks." |
| 0.5 | Most to gain (triathlon) | The leg furthest from its race-day target | "Run: to manage 3:30 on race day, you need about 3:03 over Marathon when fresh." |
| 1 / 2 | Weekly distance | < 60 % / < 85 % of the target volume | "Over the last 3 months you've run 40 km a week. For this goal, aim for about 65 km." |
| 1.2 | Speed first | The speed check (§3) says the shorter best is too slow | "Your 5 km (21:00) is slower than this goal needs (about 17:55). Speed comes first." |
| 1.5 / 2.5 | Long session | Longest in 3 months < 60 % / < 90 % of what the race needs | "Your longest run in 3 months: 14 km. Build towards 18 km." |
| 1.8 | Trend | Recent weekly distance < 70 % of the 3-month average | "Your running dropped in the last 4 weeks: 22 km a week, down from 35 km." |
| 2.2 | Frequency | Fewer sessions per week than run 3, bike 2, swim 2 | "You swim about 1× a week. Try 2×." |
| 2.4 | Consistency | Trained in fewer than 70 % of the 12 weeks | "You ran in 7 of the last 12 weeks. Steady weeks beat big ones." |
| 2.6 | Endurance first | The speed check says the shorter best is fast enough | "Your 5 km is already fast enough. Build endurance." |
| 2.8 / 3.6 | Nutrition (triathlon) | Full / half Ironman | "Practise eating and drinking on long sessions." |
| 2.9 | Brick (triathlon) | Always | "Once a week, run 15–20 minutes straight after a ride." |
| 3 | Key session | By sport and distance, with the user's paces (VDOT of the goal) | 5 km: 5–6 × 1 km at interval pace; 10 km: 4–5 × 2 km at threshold; half: 3 × 10 min at threshold + long run; marathon: 2 × 20 min at goal pace; bike ≤ 40 km: 2 × 20 min near threshold; longer: long zone-2 ride; swim: 10 × 100 m at goal pace − 3 s |
| 3.3 | Fuel | Marathon, bike ≥ 90 km | "Practise taking energy every 30–45 minutes on your long runs." / "about 60 g of carbs an hour" |
| 3.4–3.5 | Step size | Gap level (§2) | "Close. A few focused weeks can do it." / "A big step. Aim for 47:00 first." |
| 3.8 / 4.2 | Open water / technique | Swims ≥ 1.9 km, triathlon / all swims | "Practise in open water with a wetsuit." |
| 5 / 5.5 | 80/20, recovery week | Always | "Keep about 80 % easy." / "Add at most ~10 % a week; an easier week every 3–4 weeks." |

**Target volume:** running grows with the goal's level: 25 / 35 / 45 / 55 km a week for 5 km / 10 km / half / marathon at VDOT 45, plus about 1.5 km per VDOT point above (a 1:20 half ≈ 65 km). Bike and swim use §4. Triathlon per week: half 6 km swim, 150 km bike, 30 km run; full 9 / 220 / 45 km. Long sessions: run 12 / 18 / 30 km (10 km / half / marathon), bike 60 km (40 km) or 75 % of 90 / 180 km, swim the race distance (from 1.9 km).
