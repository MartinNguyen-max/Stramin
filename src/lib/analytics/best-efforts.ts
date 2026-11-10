import type { CalendarActivity } from "./calendar";

/**
 * Best efforts (BE-1..7). Pure functions, no database or Next imports (also used by the Drizzle schema).
 * v1 estimates them from activity summaries (ADR 0011); manual values win.
 */

export const EFFORT_SPORTS = ["run", "bike", "swim"] as const;
export type EffortSport = (typeof EFFORT_SPORTS)[number];

/** The distances we track, in meters (BE-2). Bike 100 and 120 km added after owner feedback P3. */
export const EFFORT_DISTANCES: Record<EffortSport, readonly number[]> = {
  run: [1000, 5000, 10_000, 21_097.5, 42_195],
  bike: [20_000, 40_000, 90_000, 100_000, 120_000, 180_000],
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
/** Strava's best effort distances are matched to ours within 1 %. */
const DISTANCE_TOLERANCE = 0.01;

/** An activity with what best efforts need besides the calendar fields. */
export type EffortActivity = CalendarActivity & {
  /** Total time including pauses. */
  elapsedSeconds: number;
  /** Strava's own best efforts for this run, when they were fetched (ADR 0013). */
  exactEfforts?: { distance: number; seconds: number }[] | null;
};

export type EstimatedEffort = {
  sport: EffortSport;
  distance: number;
  seconds: number;
  activityId: string;
  /** "YYYY-MM-DD" */
  date: string;
  /** True when it's Strava's own best effort, not an estimate from the average pace. */
  exact: boolean;
};

/**
 * Runs count their total time, pauses included, like Strava does (owner feedback P1): stopping the
 * watch for 10 minutes inside a fast 5 km doesn't make it faster. Pool swims and rides use moving
 * time, since rests between sets and stops at lights aren't part of the effort.
 */
function effortSeconds(activity: EffortActivity): number {
  return activity.sport === "run"
    ? Math.max(activity.elapsedSeconds, activity.movingSeconds)
    : activity.movingSeconds;
}

/**
 * Best time per distance (ADR 0011, ADR 0013): Strava's own best effort where we have it (exact),
 * otherwise the best average pace of an activity at least as long as the distance, times the distance
 * (exact for races, on the safe side for segments of longer activities).
 */
export function estimateBestEfforts(
  activities: EffortActivity[],
): EstimatedEffort[] {
  const result: EstimatedEffort[] = [];
  for (const sport of EFFORT_SPORTS) {
    const candidates = activities.filter(
      (activity) =>
        activity.sport === sport &&
        activity.distanceMeters > 0 &&
        effortSeconds(activity) > 0,
    );
    for (const distance of EFFORT_DISTANCES[sport]) {
      let best: EstimatedEffort | undefined;
      for (const activity of candidates) {
        if (activity.distanceMeters < distance * MIN_SHARE) continue;
        const exact = activity.exactEfforts?.find(
          (effort) =>
            Math.abs(effort.distance - distance) <=
            distance * DISTANCE_TOLERANCE,
        );
        const seconds = exact
          ? exact.seconds
          : (effortSeconds(activity) / activity.distanceMeters) * distance;
        if (!best || seconds < best.seconds) {
          best = {
            sport,
            distance,
            seconds,
            activityId: activity.id,
            date: activity.startLocal.slice(0, 10),
            exact: Boolean(exact),
          };
        }
      }
      if (best) result.push(best);
    }
  }
  return result;
}

/**
 * The runs worth fetching Strava's own best efforts for (ADR 0013): per distance, the few runs with the
 * best average pace (pauses included). A record is almost always inside one of them.
 */
export function runDetailCandidates(
  activities: EffortActivity[],
  perDistance = 3,
): string[] {
  const runs = activities.filter(
    (activity) => activity.sport === "run" && activity.distanceMeters > 0,
  );
  const ids = new Set<string>();
  for (const distance of EFFORT_DISTANCES.run) {
    runs
      .filter((run) => run.distanceMeters >= distance * MIN_SHARE)
      .sort(
        (a, b) =>
          effortSeconds(a) / a.distanceMeters -
          effortSeconds(b) / b.distanceMeters,
      )
      .slice(0, perDistance)
      .forEach((run) => {
        ids.add(run.id);
      });
  }
  return [...ids];
}

/** The rides worth fetching power data for: the ones with the highest (weighted) average power. */
export function rideDetailCandidates(
  rides: {
    id: string;
    deviceWatts: boolean;
    movingSeconds: number;
    avgWatts: number | null;
    weightedAvgWatts: number | null;
  }[],
  count = 6,
): string[] {
  return rides
    .filter((ride) => ride.deviceWatts && ride.movingSeconds >= 20 * 60)
    .map((ride) => ({
      id: ride.id,
      watts: ride.weightedAvgWatts ?? ride.avgWatts ?? 0,
    }))
    .filter((ride) => ride.watts > 0)
    .sort((a, b) => b.watts - a.watts)
    .slice(0, count)
    .map((ride) => ride.id);
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
  /** For Strava values: Strava's own best effort (true) or an estimate (false). */
  exact?: boolean;
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
          exact: estimate.exact,
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
