import { type BestEffort, findEffort } from "@/lib/analytics/best-efforts";
import { FTP_SHARE, type PowerBest } from "@/lib/analytics/power";
import {
  bestVdot,
  PACE_ZONES,
  paceFor,
  type TrainingPaces,
  trainingPaces,
} from "@/lib/analytics/running";
import type { Amount, Step, Target, Workout } from "./workouts";
import type { Zone } from "./zones";

/** The user's personal paces, from their best efforts (TRN-3, ADR 0010). */
export type PersonalPaces = {
  /** Running paces in seconds per km, or null without a running best effort. */
  run: TrainingPaces | null;
  /** The running effort the paces come from. */
  runBasis: { distance: number; seconds: number; level: number } | null;
  /** Swim threshold pace in seconds per 100 m, or null without a swim best effort. */
  swimPer100: number | null;
  swimBasis: { distance: number; seconds: number } | null;
  /** Bike FTP in watts (95 % of the best 20 min), or null without power data (owner feedback 2026-11-17). */
  ftp: number | null;
  /** The best 20-minute power the FTP comes from. */
  ftpBasis: { watts: number } | null;
};

/**
 * One bike target per zone, in % of FTP (owner feedback 2026-11-17: "about 50 % = 230 W, that simple").
 * Roughly the middle of the classic power zones: Z1 recovery (< 55 %), Z2 endurance (56–75 %), Z3 tempo
 * (76–90 %), Z4 threshold (91–105 %), Z5 VO2max (106–120 %).
 */
export const BIKE_FTP_PERCENT: Record<Zone, number> = {
  1: 50,
  2: 65,
  3: 85,
  4: 100,
  5: 115,
};

/** Swim distances used for the base pace, with a correction to roughly threshold pace (s/100 m). */
const SWIM_BASES: [number, number][] = [
  [1000, 0],
  [400, 3],
  [1900, -2],
  [3800, -5],
];

/** Seconds per 100 m added to the swim threshold pace, per zone (ADR 0010). */
const SWIM_ZONE_OFFSET: Record<Zone, number> = {
  1: 15,
  2: 15,
  3: 8,
  4: 3,
  5: -2,
};

/** The user's paces from their best efforts, and their FTP from their best 20-minute power. */
export function personalPaces(
  efforts: BestEffort[],
  power: PowerBest[] = [],
): PersonalPaces {
  const runBasis = bestVdot(efforts.filter((e) => e.sport === "run"));
  let swimPer100: number | null = null;
  let swimBasis: PersonalPaces["swimBasis"] = null;
  for (const [distance, correction] of SWIM_BASES) {
    const effort = findEffort(efforts, "swim", distance);
    if (effort) {
      swimPer100 = (effort.seconds / distance) * 100 + correction;
      swimBasis = { distance, seconds: effort.seconds };
      break;
    }
  }
  return {
    run: runBasis ? trainingPaces(runBasis.level) : null,
    runBasis,
    swimPer100,
    swimBasis,
    ...ftpFrom(power),
  };
}

function ftpFrom(power: PowerBest[]): Pick<PersonalPaces, "ftp" | "ftpBasis"> {
  const twenty = power.find((entry) => entry.duration === 1200);
  if (!twenty) return { ftp: null, ftpBasis: null };
  return {
    ftp: Math.round(twenty.watts * FTP_SHARE),
    ftpBasis: { watts: twenty.watts },
  };
}

/** A bike step's target: % of FTP, and watts (rounded to 5) when the FTP is known. Null for other sports. */
export function stepPower(
  sport: Workout["sport"],
  target: Target,
  paces: PersonalPaces,
): { percent: number; watts: number | null } | null {
  if (sport !== "bike") return null;
  const percent = BIKE_FTP_PERCENT[zoneOf(target)];
  const watts =
    paces.ftp === null ? null : Math.round((paces.ftp * percent) / 100 / 5) * 5;
  return { percent, watts };
}

/** Paces used to estimate how long a workout takes when the user has no best efforts yet. */
export const DEFAULT_PACES: PersonalPaces = {
  run: trainingPaces(40),
  runBasis: null,
  swimPer100: 130,
  swimBasis: null,
  ftp: null,
  ftpBasis: null,
};

export function zoneOf(target: Target): Zone {
  return "zone" in target ? target.zone : PACE_ZONES[target.pace];
}

/** A step's pace: running s/km, swimming s/100 m. Null for bike, or without a best effort. */
export function stepPace(
  sport: Workout["sport"],
  target: Target,
  paces: PersonalPaces,
): number | null {
  if (sport === "run" && paces.run && "pace" in target) {
    return paceFor(paces.run, target.pace);
  }
  if (sport === "swim" && paces.swimPer100 !== null) {
    return paces.swimPer100 + SWIM_ZONE_OFFSET[zoneOf(target)];
  }
  return null;
}

/** For "easy" and "recovery" running: the pace range [slower, faster] in s/km. */
export function stepPaceRange(
  sport: Workout["sport"],
  target: Target,
  paces: PersonalPaces,
): [number, number] | null {
  if (sport !== "run" || !paces.run || !("pace" in target)) return null;
  const value = paces.run[target.pace];
  return Array.isArray(value) ? value : null;
}

/** How long a step takes, in seconds. Null when it's a distance and the pace is unknown. */
export function stepSeconds(
  sport: Workout["sport"],
  amount: Amount,
  target: Target,
  paces: PersonalPaces,
): number | null {
  if ("seconds" in amount) return amount.seconds;
  const pace = stepPace(sport, target, paces);
  if (pace === null) return null;
  return sport === "swim"
    ? (amount.meters / 100) * pace
    : (amount.meters / 1000) * pace;
}

function stepTotal(step: Step, sport: Workout["sport"], paces: PersonalPaces) {
  if (step.type !== "repeat") {
    return stepSeconds(sport, step.amount, step.target, paces) ?? 0;
  }
  const work =
    stepSeconds(sport, step.work.amount, step.work.target, paces) ?? 0;
  const rest = step.rest
    ? (stepSeconds(sport, step.rest.amount, step.rest.target, paces) ?? 0)
    : 0;
  return step.reps * work + (step.reps - 1) * rest;
}

/** About how long the workout takes, with the user's paces (or default paces without best efforts). */
export function workoutSeconds(workout: Workout, paces: PersonalPaces): number {
  const usable = withDefaults(paces);
  return workout.steps.reduce(
    (total, step) => total + stepTotal(step, workout.sport, usable),
    0,
  );
}

/** The highest zone in the workout, for its badge. */
export function maxZone(workout: Workout): Zone {
  let zone: Zone = 1;
  for (const step of workout.steps) {
    const targets =
      step.type === "repeat"
        ? [step.work.target, ...(step.rest ? [step.rest.target] : [])]
        : [step.target];
    for (const target of targets) {
      const z = zoneOf(target);
      if (z > zone) zone = z;
    }
  }
  return zone;
}

/** One block of the workout graph (owner feedback T1): how long and how hard. */
export type Segment = { seconds: number; zone: Zone };

/** The workout as blocks in order, repeats expanded (with the user's paces, or defaults). */
export function workoutSegments(
  workout: Workout,
  paces: PersonalPaces,
): Segment[] {
  const usable = withDefaults(paces);
  const segments: Segment[] = [];
  const push = (amount: Amount, target: Target) => {
    const seconds = stepSeconds(workout.sport, amount, target, usable) ?? 0;
    if (seconds > 0) segments.push({ seconds, zone: zoneOf(target) });
  };
  for (const step of workout.steps) {
    if (step.type !== "repeat") {
      push(step.amount, step.target);
      continue;
    }
    for (let i = 0; i < step.reps; i++) {
      push(step.work.amount, step.work.target);
      if (step.rest && i < step.reps - 1)
        push(step.rest.amount, step.rest.target);
    }
  }
  return segments;
}

/** About how far the workout goes, in meters (owner feedback T3). Null for bike (no speeds yet). */
export function workoutMeters(
  workout: Workout,
  paces: PersonalPaces,
): number | null {
  if (workout.sport === "bike") return null;
  const usable = withDefaults(paces);
  const meters = (amount: Amount, target: Target): number => {
    if ("meters" in amount) return amount.meters;
    // Swim rests are standing still; running time is turned into distance with the pace.
    if (workout.sport === "swim") return 0;
    const pace = stepPace(workout.sport, target, usable);
    return pace ? (amount.seconds / pace) * 1000 : 0;
  };
  let total = 0;
  for (const step of workout.steps) {
    if (step.type !== "repeat") {
      total += meters(step.amount, step.target);
    } else {
      total += step.reps * meters(step.work.amount, step.work.target);
      if (step.rest) {
        total += (step.reps - 1) * meters(step.rest.amount, step.rest.target);
      }
    }
  }
  return total;
}

/** The user's paces, with default paces where they have no best effort yet. */
export function withDefaults(paces: PersonalPaces): PersonalPaces {
  return {
    ...paces,
    run: paces.run ?? DEFAULT_PACES.run,
    swimPer100: paces.swimPer100 ?? DEFAULT_PACES.swimPer100,
  };
}
