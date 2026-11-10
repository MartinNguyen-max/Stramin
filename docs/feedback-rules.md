# Goal feedback rules (GOAL-4..6)

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
