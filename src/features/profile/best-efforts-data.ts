import { and, eq } from "drizzle-orm";
import { getStravaStatus, loadEffortData } from "@/features/activities/data";
import type { CurrentUser } from "@/features/auth/current-user";
import {
  type BestEffort,
  type EffortSport,
  estimateBestEfforts,
  type ManualEffort,
  mergeBestEfforts,
} from "@/lib/analytics/best-efforts";
import type { CalendarActivity } from "@/lib/analytics/calendar";
import { bestPowerAcross, type PowerBest } from "@/lib/analytics/power";
import { withRls } from "@/lib/db/rls";
import { personalBests } from "@/lib/db/schema";

export type BestEffortsResult = {
  efforts: BestEffort[];
  /** All activities (for volume checks), or null when Strava isn't connected. */
  activities: CalendarActivity[] | null;
  /** False when the manual values can't be read (the table doesn't exist yet). */
  manualAvailable: boolean;
  /** Best bike power per duration (BE-3), from rides with a power meter. */
  power: PowerBest[];
};

/**
 * The user's best efforts: Strava's own best efforts and estimates from their history, plus their own
 * values, which win (BE-6, BE-7, ADR 0011, ADR 0013). Also the best bike power. Used by Profile, Goals
 * and Training.
 */
export async function loadBestEfforts(
  user: CurrentUser,
): Promise<BestEffortsResult> {
  const status = await getStravaStatus(user.id);
  const [data, manual] = await Promise.all([
    status.connected ? loadEffortData(user) : null,
    listManualEfforts(user).catch((error) => {
      console.error("[best efforts] manual values unavailable", error);
      return null;
    }),
  ]);
  return {
    efforts: mergeBestEfforts(
      data ? estimateBestEfforts(data.activities) : [],
      manual ?? [],
    ),
    activities: data?.activities ?? null,
    manualAvailable: manual !== null,
    power: data ? bestPowerAcross(data.rides) : [],
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
