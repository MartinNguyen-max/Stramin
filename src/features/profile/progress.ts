import {
  type BestEffort,
  EFFORT_SPORTS,
  type EffortActivity,
  type EffortSport,
  estimateBestEfforts,
  type ManualEffort,
  mergeBestEfforts,
} from "@/lib/analytics/best-efforts";
import { addDays } from "@/lib/dates";

/**
 * "You now vs. you X months ago" (owner feedback 2026-11-12): best efforts and weekly training then and
 * now. Best efforts use Strava history and the user's own values (owner feedback 2026-11-26): an own
 * value counts as "now", and as "then" when its date is on or before the comparison day. Without a date
 * it counts only as "now". Pure, unit tested.
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

/** The same sport and distance in another list of best efforts. */
function findEffort(
  list: BestEffort[],
  target: BestEffort,
): BestEffort | undefined {
  return list.find(
    (effort) =>
      effort.sport === target.sport && effort.distance === target.distance,
  );
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
  manual: ManualEffort[] = [],
): ProgressPeriod {
  const since = monthsBefore(todayDate, months);
  const earlier = activities.filter(
    (activity) => activity.startLocal.slice(0, 10) <= since,
  );
  const ownBefore = manual.filter(
    (effort) => effort.date !== null && effort.date <= since,
  );
  const bestBefore = mergeBestEfforts(estimateBestEfforts(earlier), ownBefore);
  const bestNow = mergeBestEfforts(estimateBestEfforts(activities), manual);
  const past = weekly(activities, since);
  const present = weekly(activities, todayDate);

  const efforts: ProgressPeriod["efforts"] = [];
  for (const now of bestNow) {
    const before = findEffort(bestBefore, now);
    efforts.push({
      sport: now.sport,
      distance: now.distance,
      before: before?.seconds,
      now: now.seconds,
    });
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

/** The user's own values from a merged list of best efforts (manual values win there). */
export function ownEfforts(efforts: BestEffort[]): ManualEffort[] {
  return efforts
    .filter((effort) => effort.source === "manual")
    .map((effort) => ({
      sport: effort.sport,
      distance: effort.distance,
      seconds: effort.seconds,
      date: effort.date,
    }));
}
