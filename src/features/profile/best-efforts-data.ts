import { and, eq } from "drizzle-orm";
import { loadActivitiesIfConnected } from "@/features/activities/data";
import type { CurrentUser } from "@/features/auth/current-user";
import {
  type BestEffort,
  type EffortSport,
  estimateBestEfforts,
  type ManualEffort,
  mergeBestEfforts,
} from "@/lib/analytics/best-efforts";
import type { CalendarActivity } from "@/lib/analytics/calendar";
import { withRls } from "@/lib/db/rls";
import { personalBests } from "@/lib/db/schema";

export type BestEffortsResult = {
  efforts: BestEffort[];
  /** All activities (for volume checks), or null when Strava isn't connected. */
  activities: CalendarActivity[] | null;
  /** False when the manual values can't be read (the table doesn't exist yet). */
  manualAvailable: boolean;
};

/**
 * The user's best efforts: estimates from their Strava history plus their own values, which win
 * (BE-6, BE-7, ADR 0011). Used by Profile, Goals and Training.
 */
export async function loadBestEfforts(
  user: CurrentUser,
): Promise<BestEffortsResult> {
  const [activities, manual] = await Promise.all([
    loadActivitiesIfConnected(user),
    listManualEfforts(user).catch((error) => {
      console.error("[best efforts] manual values unavailable", error);
      return null;
    }),
  ]);
  return {
    efforts: mergeBestEfforts(
      activities ? estimateBestEfforts(activities) : [],
      manual ?? [],
    ),
    activities,
    manualAvailable: manual !== null,
  };
}

export async function listManualEfforts(
  user: CurrentUser,
): Promise<ManualEffort[]> {
  const rows = await withRls(user.claims, (tx) =>
    tx.select().from(personalBests).where(eq(personalBests.userId, user.id)),
  );
  return rows.map((row) => ({
    sport: row.sport,
    distance: row.distanceM,
    seconds: row.seconds,
    date: row.achievedOn,
  }));
}

export async function saveManualEffort(
  user: CurrentUser,
  effort: ManualEffort,
): Promise<void> {
  const values = {
    seconds: Math.round(effort.seconds),
    achievedOn: effort.date,
    updatedAt: new Date(),
  };
  await withRls(user.claims, (tx) =>
    tx
      .insert(personalBests)
      .values({
        userId: user.id,
        sport: effort.sport,
        distanceM: effort.distance,
        ...values,
      })
      .onConflictDoUpdate({
        target: [
          personalBests.userId,
          personalBests.sport,
          personalBests.distanceM,
        ],
        set: values,
      }),
  );
}

export async function deleteManualEffort(
  user: CurrentUser,
  sport: EffortSport,
  distance: number,
): Promise<void> {
  await withRls(user.claims, (tx) =>
    tx
      .delete(personalBests)
      .where(
        and(
          eq(personalBests.userId, user.id),
          eq(personalBests.sport, sport),
          eq(personalBests.distanceM, distance),
        ),
      ),
  );
}
