import { distanceKey, type EffortSport } from "@/lib/analytics/best-efforts";
import {
  bestVdot,
  equivalentTime,
  riegel,
  strongestRiegelEffort,
} from "@/lib/analytics/running";

/**
 * Triathlon goals (owner feedback 2026-11-11, G1): half and full distance (Ironman 70.3 and Ironman
 * distances), with a target time per discipline. Pure, unit tested.
 */

export const TRIATHLON_RACES = ["quarter", "half", "full"] as const;
export type TriathlonRace = (typeof TRIATHLON_RACES)[number];

/** The disciplines in race order. Their distances are all tracked best effort distances (BE-2). */
export const LEGS = ["swim", "bike", "run"] as const satisfies EffortSport[];
export type Leg = (typeof LEGS)[number];

type RaceDistances = {
  /** The whole race in meters, stored as the goal's distance. */
  distance: number;
  legs: Record<Leg, number>;
};

export const TRIATHLONS: Record<TriathlonRace, RaceDistances> = {
  quarter: {
    distance: 56_550,
    legs: { swim: 1000, bike: 45_000, run: 10_550 },
  },
  half: {
    distance: 113_000,
    legs: { swim: 1900, bike: 90_000, run: 21_097.5 },
  },
  full: { distance: 226_000, legs: { swim: 3800, bike: 180_000, run: 42_195 } },
};

/** Target times in seconds. Transitions (T1 + T2) are optional and may be 0. */
export type Splits = Record<Leg, number> & { transitions: number };

export function raceForDistance(distance: number): TriathlonRace | null {
  return (
    TRIATHLON_RACES.find((race) => TRIATHLONS[race].distance === distance) ??
    null
  );
}

export function totalTime(splits: Splits): number {
  return splits.swim + splits.bike + splits.run + splits.transitions;
}

/**
 * How much slower a leg usually is on race day than a fresh best at that distance, because everything
 * happens on the same day (owner feedback 2026-11-12). Estimates: the swim comes first; the bike is
 * ridden a bit easier to save the legs; the run comes after hours of work, much more in a full
 * Ironman.
 */
export const RACE_DAY_FACTOR: Record<TriathlonRace, Record<Leg, number>> = {
  quarter: { swim: 1, bike: 1.02, run: 1.05 },
  half: { swim: 1, bike: 1.03, run: 1.08 },
  full: { swim: 1, bike: 1.05, run: 1.15 },
};

/** What a fresh time is worth on race day, e.g. a 3:27 marathon ≈ 3:58 in an Ironman. */
export function raceDayTime(
  race: TriathlonRace,
  leg: Leg,
  fresh: number,
): number {
  return fresh * RACE_DAY_FACTOR[race][leg];
}

/** The fresh time needed for a race-day target, e.g. 3:30 in an Ironman needs a ~3:03 marathon. */
export function freshTimeNeeded(
  race: TriathlonRace,
  leg: Leg,
  target: number,
): number {
  return target / RACE_DAY_FACTOR[race][leg];
}

/**
 * A fresh time for a leg: the best at that distance, else predicted from the other bests (VDOT for
 * running, Riegel for bike and swim). The quarter's 45 km and 10.55 km aren't tracked distances, so
 * they're always predicted. Null without any best in that sport.
 */
export function freshTime(
  leg: Leg,
  meters: number,
  bests: { sport: EffortSport; distance: number; seconds: number }[],
): { seconds: number; predicted: boolean } | null {
  const own = bests.filter((best) => best.sport === leg);
  const exact = own.find(
    (best) => distanceKey(best.distance) === distanceKey(meters),
  );
  if (exact) return { seconds: exact.seconds, predicted: false };
  if (leg === "run") {
    const level = bestVdot(own);
    return level
      ? { seconds: equivalentTime(level.level, meters), predicted: true }
      : null;
  }
  const strongest = strongestRiegelEffort(own);
  return strongest
    ? {
        seconds: riegel(strongest.seconds, strongest.distance, meters),
        predicted: true,
      }
    : null;
}

/**
 * A realistic race-day time for a leg (owner feedback 2026-11-12): `freshTime`, made slower for race
 * day (`RACE_DAY_FACTOR`). Null without any best in that sport.
 */
export function legBasis(
  race: TriathlonRace,
  leg: Leg,
  meters: number,
  bests: { sport: EffortSport; distance: number; seconds: number }[],
): number | null {
  const fresh = freshTime(leg, meters, bests);
  return fresh === null ? null : raceDayTime(race, leg, fresh.seconds);
}
