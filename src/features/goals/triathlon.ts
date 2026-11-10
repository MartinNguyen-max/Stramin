import type { EffortSport } from "@/lib/analytics/best-efforts";

/**
 * Triathlon goals (owner feedback 2026-11-11, G1): half and full distance (Ironman 70.3 and Ironman
 * distances), with a target time per discipline. Pure, unit tested.
 */

export const TRIATHLON_RACES = ["half", "full"] as const;
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
 * Running after the bike is usually 5–10 % slower than a fresh run of the same distance.
 * Gives the expected range for the run leg from a fresh best.
 */
export function runOffTheBike(freshBest: number): [number, number] {
  return [freshBest * 1.05, freshBest * 1.1];
}
