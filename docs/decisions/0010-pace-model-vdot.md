# 0010 – VDOT as the running pace model

- **Status:** Accepted (decided in work mode, to be reviewed by the owner)
- **Date:** 2026-11-10

## Context
Two features need a running model:
- **Training inspiration (TRN-3):** personal target paces per workout step (e.g. "12 × 400 m at 1:24").
- **Goals (GOAL-6):** equivalent performances (e.g. "10 km in 40:00 usually needs a 5 km of about 19:15").

## Options
- **Riegel** (`T2 = T1 × (D2 / D1)^1.06`): one line, good for race predictions. Says nothing about training paces.
- **VDOT** (Jack Daniels' Running Formula): one number for the runner's level, from any race result. Gives both race equivalents and the five classic training paces (Easy, Marathon, Threshold, Interval, Repetition). Widely used (Daniels' tables, many calculators).
- **Critical speed / % of 5 km pace:** simple rules of thumb, less consistent across distances.

## Decision
**VDOT**, using the Daniels–Gilbert equations:

- Speed `v` in m/min, time `t` in minutes.
- Oxygen cost: `VO2 = −4.60 + 0.182258·v + 0.000104·v²`
- Share of VO2max that can be held for `t` minutes: `%max = 0.8 + 0.1894393·e^(−0.012778·t) + 0.2989558·e^(−0.1932605·t)`
- `VDOT = VO2 / %max`

The user's VDOT is the **highest** VDOT across their running best efforts (1 km to marathon).

**Training paces** (speed at a share of VDOT, solving the VO2 equation for `v`):

| Pace | Share of VDOT | Zone |
|---|---|---|
| Recovery | 55–62 % | Z1 |
| Easy | 62–70 % | Z2 |
| Marathon | the predicted marathon race pace | Z3 |
| Threshold | 88 % | Z4 |
| Interval | 97.5 % | Z5 |
| Repetition | 105 % | Z5 |

**Race equivalents:** the time at another distance with the same VDOT (solved numerically).

Check: a 5 km in 19:57 gives VDOT ≈ 50, threshold ≈ 4:15/km and interval ≈ 3:55/km, which matches Daniels' tables.

**Swim:** there is no VDOT for swimming. Swim steps use the pace per 100 m of the best swim effort (preferably 400 m–1 km) plus fixed offsets per zone (Z1–Z2 +15 s, Z3 +8 s, Z4 +3 s, Z5 −2 s per 100 m). **Bike** steps show zones only (no power data yet).

## Consequences
- One model for paces and predictions, so the numbers agree with each other.
- Pure, unit-tested functions in `src/lib/analytics/running.ts`.
- VDOT assumes the best effort was a real all-out effort. Estimated best efforts (ADR 0011) are on the slow side, so the paces are on the safe side too.
- Heart-rate zones are shown as Z1–Z5 labels only, until we know the user's max or threshold heart rate.
