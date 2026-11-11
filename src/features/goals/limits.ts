import { distanceKey, type EffortSport } from "@/lib/analytics/best-efforts";

/**
 * Plausible goal times (owner feedback 2026-11-12): nobody runs 5 km in 10 minutes, and a goal of
 * 5 km in an hour isn't a running goal. Wide enough for everyone, from beginners to the world's best.
 * Pure, unit tested; used by the form and the server.
 */

/** Just under the running world records, in seconds (by `distanceKey`). */
const RUN_FASTEST: Record<number, number> = {
  1000: 130,
  5000: 750,
  10000: 1560,
  21098: 3420,
  42195: 7200,
};

/** Run: up to 10:00 /km. Bike: 15–55 km/h. Swim: 0:55–4:00 /100 m. */
const RUN_SLOWEST_PER_KM = 600;
const BIKE_KMH = { fastest: 55, slowest: 15 };
const SWIM_PER_100 = { fastest: 55, slowest: 240 };

/** Transitions (T1 + T2) take at most this long. */
export const MAX_TRANSITIONS = 30 * 60;

export type TimeLimits = { min: number; max: number };

/** The fastest and slowest plausible time, in whole seconds, for a sport and distance. */
export function timeLimits(sport: EffortSport, distance: number): TimeLimits {
  const km = distance / 1000;
  switch (sport) {
    case "run":
      return {
        min: RUN_FASTEST[distanceKey(distance)] ?? Math.floor(km * 130),
        max: Math.ceil(km * RUN_SLOWEST_PER_KM),
      };
    case "bike":
      return {
        min: Math.floor((km / BIKE_KMH.fastest) * 3600),
        max: Math.ceil((km / BIKE_KMH.slowest) * 3600),
      };
    case "swim":
      return {
        min: Math.floor((distance / 100) * SWIM_PER_100.fastest),
        max: Math.ceil((distance / 100) * SWIM_PER_100.slowest),
      };
  }
}

export function isWithinLimits(
  sport: EffortSport,
  distance: number,
  seconds: number,
): boolean {
  const { min, max } = timeLimits(sport, distance);
  return seconds >= min && seconds <= max;
}
