import { and, asc, eq, gte, lt } from "drizzle-orm";
import { cache } from "react";
import type { CurrentUser } from "@/features/auth/current-user";
import { getStravaConnection } from "@/features/strava/connection";
import type { EffortActivity } from "@/lib/analytics/best-efforts";
import type { CalendarActivity } from "@/lib/analytics/calendar";
import { addDays } from "@/lib/dates";
import { withRls } from "@/lib/db/rls";
import { activities, type ConnectionRow } from "@/lib/db/schema";

/**
 * The user's activities from our database (NFR-3): pages never wait for Strava.
 * With a `range` ("YYYY-MM-DD", inclusive, local days), only those days (HOME-10). Runs as the user (RLS).
 */
export async function loadActivities(
  user: CurrentUser,
  range?: { from: string; to: string },
): Promise<CalendarActivity[]> {
  const rows = await withRls(user.claims, (tx) =>
    tx
      .select({
        id: activities.providerActivityId,
        name: activities.name,
        sport: activities.sport,
        startLocal: activities.startLocal,
        movingSeconds: activities.movingSeconds,
        distanceMeters: activities.distanceM,
        indoor: activities.isIndoor,
      })
      .from(activities)
      .where(
        and(
          eq(activities.userId, user.id),
          range ? gte(activities.startLocal, range.from) : undefined,
          range ? lt(activities.startLocal, addDays(range.to, 1)) : undefined,
        ),
      )
      .orderBy(asc(activities.startLocal)),
  );
  return rows;
}

/** What the UI may know about the Strava connection: never the tokens. */
export type StravaStatus =
  /** `unavailable`: the status couldn't be read (database error). */
  | { connected: false; unavailable?: boolean }
  | {
      connected: true;
      athleteName: string | null;
      importState: ConnectionRow["importState"];
      importedCount: number;
      /** ISO string, or null before the first sync. */
      lastSyncAt: string | null;
      lastError: string | null;
    };

/** The user's Strava status, once per request. */
export const getStravaStatus = cache(
  async (userId: string): Promise<StravaStatus> => {
    let connection: ConnectionRow | undefined;
    try {
      connection = await getStravaConnection(userId);
    } catch (error) {
      // Show a "try again" note instead of an error page, and never a wrong "Connect Strava" (H11).
      console.error("[strava] status unavailable", error);
      return { connected: false, unavailable: true };
    }
    if (!connection) return { connected: false };
    return {
      connected: true,
      athleteName: connection.athleteName,
      importState: connection.importState,
      importedCount: connection.importedCount,
      lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
      lastError: connection.lastError,
    };
  },
);

/** Activities when Strava is connected, otherwise null (the page shows "Connect Strava"). */
export async function loadActivitiesIfConnected(
  user: CurrentUser,
  range?: { from: string; to: string },
): Promise<CalendarActivity[] | null> {
  const status = await getStravaStatus(user.id);
  if (!status.connected) return null;
  return loadActivities(user, range);
}

/** What Profile, Goals and Training need for best efforts and power (BE-1..7, ADR 0013). */
export type EffortData = {
  activities: EffortActivity[];
  rides: {
    id: string;
    startLocal: string;
    powerBests: Record<string, number> | null;
  }[];
};

/**
 * All activities with their elapsed time, Strava's own best efforts and power bests.
 * Falls back to the calendar fields when the newer columns don't exist yet (database not updated).
 */
export async function loadEffortData(user: CurrentUser): Promise<EffortData> {
  try {
    const rows = await withRls(user.claims, (tx) =>
      tx
        .select({
          id: activities.providerActivityId,
          name: activities.name,
          sport: activities.sport,
          startLocal: activities.startLocal,
          movingSeconds: activities.movingSeconds,
          elapsedSeconds: activities.elapsedSeconds,
          distanceMeters: activities.distanceM,
          indoor: activities.isIndoor,
          exactEfforts: activities.bestEfforts,
          powerBests: activities.powerBests,
        })
        .from(activities)
        .where(eq(activities.userId, user.id))
        .orderBy(asc(activities.startLocal)),
    );
    return {
      activities: rows.map(({ powerBests: _, ...activity }) => activity),
      rides: rows
        .filter((row) => row.sport === "bike" && row.powerBests)
        .map((row) => ({
          id: row.id,
          startLocal: row.startLocal,
          powerBests: row.powerBests,
        })),
    };
  } catch (error) {
    console.error("[activities] effort data unavailable, using basics", error);
    const basic = await loadActivities(user);
    return {
      activities: basic.map((activity) => ({
        ...activity,
        elapsedSeconds: activity.movingSeconds,
      })),
      rides: [],
    };
  }
}
