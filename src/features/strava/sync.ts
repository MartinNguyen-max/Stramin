import { and, eq, lt, notInArray, sql } from "drizzle-orm";
import { isIndoorStrava, sportFromStrava } from "@/lib/analytics/sports";
import { getAdminDb } from "@/lib/db/client";
import { activities, type ConnectionRow } from "@/lib/db/schema";
import {
  fetchActivities,
  fetchActivity,
  RateTracker,
  type StravaActivity,
} from "@/lib/strava/client";
import {
  accessTokenFor,
  listStravaConnections,
  updateConnection,
} from "./connection";

/**
 * Strava sync v1 (ADR 0012): activity summaries only. Server only (admin database connection).
 */

const HOUR_MS = 60 * 60 * 1000;
/** A full refresh re-fetches everything well within Strava's 7-day limit (CON-8). */
export const FULL_REFRESH_AFTER_MS = 24 * HOUR_MS;
/** Quick syncs catch anything the webhook missed. */
export const QUICK_SYNC_AFTER_MS = 3 * HOUR_MS;
/** Strava data that couldn't be refreshed for this long is deleted (ADR 0009). */
export const MAX_AGE_MS = 7 * 24 * HOUR_MS;
/** A quick sync looks back this far. */
const QUICK_SYNC_DAYS = 3;
const UPSERT_CHUNK = 300;

type ActivityInsert = typeof activities.$inferInsert;

/** Maps a Strava summary to our row (SPT-1..3). Pure, unit tested. */
export function toActivityValues(
  userId: string,
  activity: StravaActivity,
  now: Date,
): ActivityInsert {
  return {
    userId,
    provider: "strava",
    providerActivityId: String(activity.id),
    name: (activity.name ?? "").slice(0, 200) || activity.sport_type,
    sport: sportFromStrava(activity.sport_type),
    sportType: activity.sport_type,
    isIndoor: isIndoorStrava(activity.sport_type, activity.trainer),
    startTime: new Date(activity.start_date),
    startLocal: activity.start_date_local,
    movingSeconds: Math.round(activity.moving_time ?? 0),
    elapsedSeconds: Math.round(activity.elapsed_time ?? 0),
    distanceM: activity.distance ?? 0,
    elevationM: activity.total_elevation_gain ?? null,
    fetchedAt: now,
  };
}

async function upsertActivities(
  userId: string,
  list: StravaActivity[],
  now: Date,
): Promise<void> {
  const db = getAdminDb();
  for (let i = 0; i < list.length; i += UPSERT_CHUNK) {
    const rows = list
      .slice(i, i + UPSERT_CHUNK)
      .map((activity) => toActivityValues(userId, activity, now));
    await db
      .insert(activities)
      .values(rows)
      .onConflictDoUpdate({
        target: [activities.provider, activities.providerActivityId],
        set: {
          userId: sql`excluded.user_id`,
          name: sql`excluded.name`,
          sport: sql`excluded.sport`,
          sportType: sql`excluded.sport_type`,
          isIndoor: sql`excluded.is_indoor`,
          startTime: sql`excluded.start_time`,
          startLocal: sql`excluded.start_local`,
          movingSeconds: sql`excluded.moving_seconds`,
          elapsedSeconds: sql`excluded.elapsed_seconds`,
          distanceM: sql`excluded.distance_m`,
          elevationM: sql`excluded.elevation_m`,
          fetchedAt: sql`excluded.fetched_at`,
        },
      });
  }
}

/**
 * Fetches the whole history and stores it (CON-3 import, CON-8 daily refresh).
 * Activities that are no longer on Strava are deleted. Progress is saved after each round of pages.
 */
export async function syncAll(
  connection: ConnectionRow,
  tracker: RateTracker,
  { isImport }: { isImport: boolean },
): Promise<number> {
  const now = new Date();
  if (isImport) {
    await updateConnection(connection.id, {
      importState: "running",
      lastError: null,
    });
  }
  const token = await accessTokenFor(connection);
  let stored = 0;
  const list = await fetchActivities(
    token,
    {},
    {
      tracker,
      onBatch: async (soFar) => {
        await upsertActivities(connection.userId, soFar.slice(stored), now);
        stored = soFar.length;
        if (isImport) {
          await updateConnection(connection.id, { importedCount: stored });
        }
      },
    },
  );

  // Everything was fetched, so anything we have that Strava didn't return was deleted there.
  const ids = list.map((activity) => String(activity.id));
  const missing = and(
    eq(activities.userId, connection.userId),
    eq(activities.provider, "strava"),
  );
  await getAdminDb()
    .delete(activities)
    .where(
      ids.length > 0
        ? and(missing, notInArray(activities.providerActivityId, ids))
        : missing,
    );

  await updateConnection(connection.id, {
    importState: "done",
    importedCount: list.length,
    lastFullSyncAt: now,
    lastSyncAt: now,
    lastError: null,
  });
  return list.length;
}

/** The last few days only: for the Refresh button (CON-5) and as a safety net for missed webhooks. */
export async function quickSync(
  connection: ConnectionRow,
  tracker: RateTracker,
): Promise<number> {
  const now = new Date();
  const token = await accessTokenFor(connection);
  const after = now.getTime() / 1000 - QUICK_SYNC_DAYS * 24 * 3600;
  const list = await fetchActivities(token, { after }, { tracker });
  await upsertActivities(connection.userId, list, now);
  await updateConnection(connection.id, { lastSyncAt: now, lastError: null });
  return list.length;
}

/**
 * An activity was created, changed or deleted on Strava (webhook, CON-4). Webhook calls aren't signed,
 * so the event itself is never trusted: the activity is fetched from Strava, stored when it belongs to
 * this athlete, and deleted only when Strava no longer has it.
 */
export async function syncOneActivity(
  connection: ConnectionRow,
  activityId: string,
  tracker: RateTracker,
): Promise<void> {
  const token = await accessTokenFor(connection);
  const activity = await fetchActivity(token, activityId, tracker);
  if (!activity) {
    await deleteStravaActivity(connection.userId, activityId);
    return;
  }
  // Someone else's public activity must never end up in this user's calendar.
  if (String(activity.athlete?.id) !== connection.providerAthleteId) return;
  await upsertActivities(connection.userId, [activity], new Date());
}

async function deleteStravaActivity(
  userId: string,
  activityId: string,
): Promise<void> {
  await getAdminDb()
    .delete(activities)
    .where(
      and(
        eq(activities.userId, userId),
        eq(activities.provider, "strava"),
        eq(activities.providerActivityId, activityId),
      ),
    );
}

/** Deletes Strava data that couldn't be refreshed for 7 days (CON-8, ADR 0009). */
export async function deleteExpired(now: Date): Promise<number> {
  const deleted = await getAdminDb()
    .delete(activities)
    .where(
      and(
        eq(activities.provider, "strava"),
        lt(activities.fetchedAt, new Date(now.getTime() - MAX_AGE_MS)),
      ),
    )
    .returning({ id: activities.id });
  return deleted.length;
}

/** What the hourly job should do for a connection (ADR 0012). Pure, unit tested. */
export function nextStep(
  connection: Pick<
    ConnectionRow,
    "importState" | "lastFullSyncAt" | "lastSyncAt"
  >,
  now: Date,
): "import" | "full" | "quick" | "none" {
  if (connection.importState !== "done") return "import";
  const age = (date: Date | null) =>
    date ? now.getTime() - date.getTime() : Number.POSITIVE_INFINITY;
  if (age(connection.lastFullSyncAt) >= FULL_REFRESH_AFTER_MS) return "full";
  if (age(connection.lastSyncAt) >= QUICK_SYNC_AFTER_MS) return "quick";
  return "none";
}

export type JobReport = {
  connections: number;
  done: { userId: string; step: string; count?: number; error?: string }[];
  stoppedEarly: boolean;
  requests: number;
  expiredDeleted: number;
};

/** The hourly job (/api/jobs/run): import, refresh or quick-sync each connection, then clean up. */
export async function runSyncJobs(deadline: number): Promise<JobReport> {
  const tracker = new RateTracker();
  const now = new Date();
  const list = await listStravaConnections();
  const report: JobReport = {
    connections: list.length,
    done: [],
    stoppedEarly: false,
    requests: 0,
    expiredDeleted: 0,
  };

  for (const connection of list) {
    if (Date.now() > deadline || tracker.nearLimit()) {
      report.stoppedEarly = true;
      break;
    }
    const step = nextStep(connection, now);
    if (step === "none") continue;
    try {
      const count =
        step === "quick"
          ? await quickSync(connection, tracker)
          : await syncAll(connection, tracker, { isImport: step === "import" });
      report.done.push({ userId: connection.userId, step, count });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[sync] connection failed", connection.id, message);
      await updateConnection(connection.id, {
        lastError: message.slice(0, 500),
        ...(step === "import" && { importState: "failed" as const }),
      });
      report.done.push({ userId: connection.userId, step, error: message });
    }
  }

  report.expiredDeleted = await deleteExpired(now);
  report.requests = tracker.requests;
  return report;
}
