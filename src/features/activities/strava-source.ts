import { cookies } from "next/headers";
import { isIndoorStrava, sportFromStrava } from "@/lib/analytics/sports";
import type { ActivityForWeekly } from "@/lib/analytics/weekly";
import { fetchAllActivities, STRAVA_TOKEN_COOKIE } from "@/lib/strava/client";

export type LoadedActivity = ActivityForWeekly & { indoor: boolean };

/**
 * TEMPORARY (until M3/M4): reads the user's activities directly from Strava, using the short-lived
 * token cookie from the Strava test. Returns null when Strava isn't connected or the token has expired.
 * M3/M4 replaces this with stored, synced activities from the database.
 */
export async function loadStravaActivities(): Promise<LoadedActivity[] | null> {
  const token = (await cookies()).get(STRAVA_TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const raw = await fetchAllActivities(token);
    return raw.map((activity) => ({
      sport: sportFromStrava(activity.sport_type),
      startLocal: activity.start_date_local,
      durationSeconds: activity.moving_time,
      distanceMeters: activity.distance,
      indoor: isIndoorStrava(activity.sport_type, activity.trainer),
    }));
  } catch (error) {
    console.warn("[strava] could not load activities", error);
    return null;
  }
}
