import { and, eq } from "drizzle-orm";
import {
  EFFORT_DISTANCES,
  rideDetailCandidates,
  runDetailCandidates,
} from "@/lib/analytics/best-efforts";
import { bestPowers } from "@/lib/analytics/power";
import { getAdminDb } from "@/lib/db/client";
import { activities, type ConnectionRow } from "@/lib/db/schema";
import {
  fetchActivity,
  fetchPowerStream,
  type RateTracker,
  type StravaDetailedActivity,
} from "@/lib/strava/client";
import { accessTokenFor } from "./connection";

/**
 * Exact best efforts and power (ADR 0013): for the few runs that could hold a record, Strava's own best
 * efforts; for the strongest rides, the best power from the power stream. Refreshed within 7 days
 * (ADR 0009). Server only.
 */

const DETAILS_MAX_AGE_MS = 6 * 24 * 60 * 60 * 1000;
const MATCH_TOLERANCE = 0.01;

/** Strava's best efforts for our run distances (elapsed time, like Strava shows them). */
export function runEffortsFrom(
  activity: StravaDetailedActivity,
): { distance: number; seconds: number }[] {
  const result: { distance: number; seconds: number }[] = [];
  for (const distance of EFFORT_DISTANCES.run) {
    const match = activity.best_efforts?.find(
      (effort) =>
        Math.abs(effort.distance - distance) <= distance * MATCH_TOLERANCE,
    );
    if (match) result.push({ distance, seconds: match.elapsed_time });
  }
  return result;
}

/** Stores the best efforts that came with a detailed run (e.g. from the webhook): no extra request. */
export async function storeRunEfforts(
  userId: string,
  activity: StravaDetailedActivity,
): Promise<void> {
  if (!activity.best_efforts) return;
  await getAdminDb()
    .update(activities)
    .set({
      bestEfforts: runEffortsFrom(activity),
      detailsFetchedAt: new Date(),
    })
    .where(
      and(
        eq(activities.userId, userId),
        eq(activities.provider, "strava"),
        eq(activities.providerActivityId, String(activity.id)),
      ),
    );
}

/** Fetches missing or old details for the candidate runs and rides, at most `limit` requests. */
export async function fetchDetails(
  connection: ConnectionRow,
  tracker: RateTracker,
  limit = 10,
): Promise<number> {
  const db = getAdminDb();
  const rows = await db
    .select({
      id: activities.providerActivityId,
      name: activities.name,
      sport: activities.sport,
      startLocal: activities.startLocal,
      movingSeconds: activities.movingSeconds,
      elapsedSeconds: activities.elapsedSeconds,
      distanceMeters: activities.distanceM,
      indoor: activities.isIndoor,
      deviceWatts: activities.deviceWatts,
      avgWatts: activities.avgWatts,
      weightedAvgWatts: activities.weightedAvgWatts,
      detailsFetchedAt: activities.detailsFetchedAt,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, connection.userId),
        eq(activities.provider, "strava"),
      ),
    );

  const wanted = new Set([
    ...runDetailCandidates(rows),
    ...rideDetailCandidates(rows.filter((row) => row.sport === "bike")),
  ]);
  const now = Date.now();
  const todo = rows
    .filter(
      (row) =>
        wanted.has(row.id) &&
        (!row.detailsFetchedAt ||
          now - row.detailsFetchedAt.getTime() > DETAILS_MAX_AGE_MS),
    )
    .slice(0, limit);
  if (todo.length === 0) return 0;

  const token = await accessTokenFor(connection);
  let fetched = 0;
  for (const row of todo) {
    if (tracker.nearLimit()) break;
    const where = and(
      eq(activities.userId, connection.userId),
      eq(activities.provider, "strava"),
      eq(activities.providerActivityId, row.id),
    );
    if (row.sport === "run") {
      const detail = await fetchActivity(token, row.id, tracker);
      await db
        .update(activities)
        .set({
          bestEfforts: detail ? runEffortsFrom(detail) : [],
          detailsFetchedAt: new Date(),
        })
        .where(where);
    } else {
      const stream = await fetchPowerStream(token, row.id, tracker);
      await db
        .update(activities)
        .set({
          powerBests: stream ? bestPowers(stream.time, stream.watts) : {},
          detailsFetchedAt: new Date(),
        })
        .where(where);
    }
    fetched += 1;
  }
  return fetched;
}
