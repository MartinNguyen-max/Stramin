import { cacheLife } from "next/cache";
import { cookies } from "next/headers";
import type { CalendarActivity } from "@/lib/analytics/calendar";
import { isIndoorStrava, sportFromStrava } from "@/lib/analytics/sports";
import { addDays } from "@/lib/dates";
import {
  fetchActivities,
  STRAVA_TOKEN_COOKIE,
  type StravaActivity,
} from "@/lib/strava/client";

/** Strava's `after`/`before` filter on UTC time; local days can start up to 14 h earlier or later. */
const TIMEZONE_MARGIN_SECONDS = 14 * 3600;

/** True when the temporary Strava token cookie is present (the user connected Strava in the last 6 hours). */
export async function hasStravaToken(): Promise<boolean> {
  return Boolean((await cookies()).get(STRAVA_TOKEN_COOKIE)?.value);
}

/**
 * TEMPORARY (until M3/M4): reads the user's activities directly from Strava, using the short-lived
 * token cookie from the Strava test. Returns null when Strava isn't connected or the token has expired.
 * M3/M4 replaces this with stored, synced activities from the database (NFR-3).
 *
 * With a `range` ("YYYY-MM-DD", inclusive, local days), only those activities are fetched (HOME-10),
 * so a month costs one Strava request. Without a range: the full history.
 *
 * Cached privately for 6 hours, the lifetime of the Strava token ("use cache: private"), keyed by the range,
 * so moving between pages doesn't fetch again. The cache is lost on a full reload; storing activities
 * in the database (M4) fixes that.
 */
export async function loadStravaActivities(range?: {
  from: string;
  to: string;
}): Promise<CalendarActivity[] | null> {
  "use cache: private";
  cacheLife({ stale: 6 * 60 * 60 });

  const token = (await cookies()).get(STRAVA_TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const raw = await fetchActivities(
      token,
      range
        ? {
            after:
              Date.parse(`${range.from}T00:00:00Z`) / 1000 -
              TIMEZONE_MARGIN_SECONDS,
            before:
              Date.parse(`${addDays(range.to, 1)}T00:00:00Z`) / 1000 +
              TIMEZONE_MARGIN_SECONDS,
          }
        : {},
    );
    const activities = raw.map(toCalendarActivity);
    return range
      ? activities.filter((activity) => {
          const day = activity.startLocal.slice(0, 10);
          return day >= range.from && day <= range.to;
        })
      : activities;
  } catch (error) {
    console.warn("[strava] could not load activities", error);
    return null;
  }
}

export function toCalendarActivity(activity: StravaActivity): CalendarActivity {
  return {
    id: String(activity.id),
    name: activity.name,
    sport: sportFromStrava(activity.sport_type),
    startLocal: activity.start_date_local,
    movingSeconds: activity.moving_time,
    distanceMeters: activity.distance,
    indoor: isIndoorStrava(activity.sport_type, activity.trainer),
  };
}
