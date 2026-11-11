import {
  distanceKey,
  EFFORT_DISTANCES,
  EFFORT_SPORTS,
  type EffortActivity,
  type EffortSport,
  estimateBestEfforts,
} from "@/lib/analytics/best-efforts";
import { addDays } from "@/lib/dates";

/**
 * "You now vs. you X months ago" (owner feedback 2026-11-12): best efforts and weekly training then and
 * now, from the Strava history only (manual values have no history), so both sides are measured the
 * same way. Pure, unit tested.
 */

export const PROGRESS_MONTHS = [3, 6, 12] as const;
export type ProgressMonths = (typeof PROGRESS_MONTHS)[number];

/** Weekly training is averaged over this many days before each moment. */
const WINDOW_DAYS = 12 * 7;

export type Volume = { meters: number; seconds: number };

export type ProgressPeriod = {
  months: ProgressMonths;
  /** The day we compare with ("YYYY-MM-DD"). */
  since: string;
  /** Per week, over the 12 weeks before then and before now. */
  volume: Record<EffortSport, { before: Volume; now: Volume }>;
  hours: { before: number; now: number };
  /** Every tracked distance with a best now, with the best back then if there was one. */
  efforts: {
    sport: EffortSport;
    distance: number;
    before?: number;
    now: number;
  }[];
};

function weekly(
  activities: EffortActivity[],
  end: string,
): { volume: Record<EffortSport, Volume>; seconds: number } {
  const from = addDays(end, -WINDOW_DAYS);
  const weeks = WINDOW_DAYS / 7;
  const volume = Object.fromEntries(
    EFFORT_SPORTS.map((sport) => [sport, { meters: 0, seconds: 0 }]),
  ) as Record<EffortSport, Volume>;
  let seconds = 0;
  for (const activity of activities) {
    const day = activity.startLocal.slice(0, 10);
    if (day <= from || day > end) continue;
    seconds += activity.movingSeconds / weeks;
    if (activity.sport in volume) {
      const sport = volume[activity.sport as EffortSport];
      sport.meters += activity.distanceMeters / weeks;
      sport.seconds += activity.movingSeconds / weeks;
    }
  }
  return { volume, seconds };
}

/** The same day `months` earlier (31 May − 3 months = 3 March, since February is shorter). */
export function monthsBefore(date: string, months: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 - months, day))
    .toISOString()
    .slice(0, 10);
}

/** Before and now for one look back. */
export function progressOver(
  activities: EffortActivity[],
  todayDate: string,
  months: ProgressMonths,
): ProgressPeriod {
  const since = monthsBefore(todayDate, months);
  const earlier = activities.filter(
    (activity) => activity.startLocal.slice(0, 10) <= since,
  );
  const bestBefore = estimateBestEfforts(earlier);
  const bestNow = estimateBestEfforts(activities);
  const past = weekly(activities, since);
  const present = weekly(activities, todayDate);

  const efforts: ProgressPeriod["efforts"] = [];
  for (const sport of EFFORT_SPORTS) {
    for (const distance of EFFORT_DISTANCES[sport]) {
      const find = (list: typeof bestNow) =>
        list.find(
          (effort) =>
            effort.sport === sport &&
            distanceKey(effort.distance) === distanceKey(distance),
        )?.seconds;
      const now = find(bestNow);
      if (now === undefined) continue;
      efforts.push({ sport, distance, before: find(bestBefore), now });
    }
  }

  return {
    months,
    since,
    volume: Object.fromEntries(
      EFFORT_SPORTS.map((sport) => [
        sport,
        { before: past.volume[sport], now: present.volume[sport] },
      ]),
    ) as ProgressPeriod["volume"],
    hours: { before: past.seconds, now: present.seconds },
    efforts,
  };
}
