import type { CalendarActivity } from "./calendar";

/**
 * Best efforts (BE-1..7). Pure functions, no database or Next imports (also used by the Drizzle schema).
 * v1 estimates them from activity summaries (ADR 0011); manual values win.
 */

export const EFFORT_SPORTS = ["run", "bike", "swim"] as const;
export type EffortSport = (typeof EFFORT_SPORTS)[number];

/** The distances we track, in meters (BE-2). */
export const EFFORT_DISTANCES: Record<EffortSport, readonly number[]> = {
  run: [1000, 5000, 10_000, 21_097.5, 42_195],
  bike: [20_000, 40_000, 90_000, 180_000],
  swim: [400, 1000, 1900, 3800],
};

/** Integer key for a distance (the half marathon is 21 097.5 m), used in the database and URLs. */
export function distanceKey(meters: number): number {
  return Math.round(meters);
}

export function isEffortDistance(sport: EffortSport, meters: number): boolean {
  return EFFORT_DISTANCES[sport].some((d) => distanceKey(d) === meters);
}

/** An activity counts from 98 % of the distance (GPS often measures a 5 km race as 4.95 km). */
const MIN_SHARE = 0.98;

export type EstimatedEffort = {
  sport: EffortSport;
  distance: number;
  seconds: number;
  activityId: string;
  /** "YYYY-MM-DD" */
  date: string;
};

/**
 * Estimated best time per distance: the best average pace of any activity at least as long as the distance,
 * times the distance (ADR 0011). Exact for races; on the safe (slower) side for segments of longer activities.
 */
export function estimateBestEfforts(
  activities: CalendarActivity[],
): EstimatedEffort[] {
  const result: EstimatedEffort[] = [];
  for (const sport of EFFORT_SPORTS) {
    const candidates = activities.filter(
      (activity) =>
        activity.sport === sport &&
        activity.distanceMeters > 0 &&
        activity.movingSeconds > 0,
    );
    for (const distance of EFFORT_DISTANCES[sport]) {
      let best: EstimatedEffort | undefined;
      for (const activity of candidates) {
        if (activity.distanceMeters < distance * MIN_SHARE) continue;
        const seconds =
          (activity.movingSeconds / activity.distanceMeters) * distance;
        if (!best || seconds < best.seconds) {
          best = {
            sport,
            distance,
            seconds,
            activityId: activity.id,
            date: activity.startLocal.slice(0, 10),
          };
        }
      }
      if (best) result.push(best);
    }
  }
  return result;
}

/** A manual best effort (BE-7), as stored. */
export type ManualEffort = {
  sport: EffortSport;
  /** Integer meters (distanceKey). */
  distance: number;
  seconds: number;
  date: string | null;
};

export type BestEffort = {
  sport: EffortSport;
  distance: number;
  seconds: number;
  date: string | null;
  source: "strava" | "manual";
  /** For Strava estimates: the activity it came from (BE-4). */
  activityId?: string;
  /** The Strava estimate, when a manual value overrides it. */
  estimate?: EstimatedEffort;
};

/** Merges estimates and manual values: manual wins (BE-7). One entry per distance that has a value. */
export function mergeBestEfforts(
  estimates: EstimatedEffort[],
  manual: ManualEffort[],
): BestEffort[] {
  const result: BestEffort[] = [];
  for (const sport of EFFORT_SPORTS) {
    for (const distance of EFFORT_DISTANCES[sport]) {
      const estimate = estimates.find(
        (e) =>
          e.sport === sport &&
          distanceKey(e.distance) === distanceKey(distance),
      );
      const own = manual.find(
        (m) => m.sport === sport && m.distance === distanceKey(distance),
      );
      if (own) {
        result.push({
          sport,
          distance,
          seconds: own.seconds,
          date: own.date,
          source: "manual",
          estimate,
        });
      } else if (estimate) {
        result.push({
          sport,
          distance,
          seconds: estimate.seconds,
          date: estimate.date,
          source: "strava",
          activityId: estimate.activityId,
        });
      }
    }
  }
  return result;
}

/** The best effort for a sport and distance, if any. */
export function findEffort<T extends { sport: EffortSport; distance: number }>(
  efforts: T[],
  sport: EffortSport,
  distance: number,
): T | undefined {
  return efforts.find(
    (e) =>
      e.sport === sport && distanceKey(e.distance) === distanceKey(distance),
  );
}
