import { SPORTS, type Sport } from "./sports";

export type ActivityForWeekly = {
  sport: Sport;
  /** Local start time as an ISO string without a real offset (e.g. Strava's `start_date_local`). */
  startLocal: string;
  /** Duration in seconds. */
  durationSeconds: number;
  /** Distance in meters (0 when the activity has no distance, e.g. strength). */
  distanceMeters?: number;
};

export type SportTotals = Record<Sport, number>;

export type WeekTotals = {
  /** First day of the week, as YYYY-MM-DD in the athlete's local time. */
  weekStart: string;
  seconds: SportTotals;
  meters: SportTotals;
  totalSeconds: number;
};

export type WeekStartDay = "monday" | "sunday";

const DAY_MS = 86_400_000;

/** Returns the first day of the week for a local date-time string, as YYYY-MM-DD. */
export function weekStartOf(
  startLocal: string,
  weekStartDay: WeekStartDay = "monday",
): string {
  // Read the date part as UTC, so the athlete's local calendar day is kept regardless of server timezone.
  const day = new Date(`${startLocal.slice(0, 10)}T00:00:00Z`);
  const dayIndex =
    weekStartDay === "monday" ? (day.getUTCDay() + 6) % 7 : day.getUTCDay();
  return new Date(day.getTime() - dayIndex * DAY_MS).toISOString().slice(0, 10);
}

export function emptyTotals(): SportTotals {
  return Object.fromEntries(SPORTS.map((sport) => [sport, 0])) as SportTotals;
}

function emptyWeek(weekStart: string): WeekTotals {
  return {
    weekStart,
    seconds: emptyTotals(),
    meters: emptyTotals(),
    totalSeconds: 0,
  };
}

/** Sums training time and distance per sport per week (HOME-1, HOME-2). Newest week first. Weeks without training are omitted. */
export function weeklyTotals(
  activities: ActivityForWeekly[],
  weekStartDay: WeekStartDay = "monday",
): WeekTotals[] {
  const weeks = new Map<string, WeekTotals>();

  for (const activity of activities) {
    const weekStart = weekStartOf(activity.startLocal, weekStartDay);
    let week = weeks.get(weekStart);
    if (!week) {
      week = emptyWeek(weekStart);
      weeks.set(weekStart, week);
    }
    week.seconds[activity.sport] += activity.durationSeconds;
    week.meters[activity.sport] += activity.distanceMeters ?? 0;
    week.totalSeconds += activity.durationSeconds;
  }

  return [...weeks.values()].sort((a, b) =>
    b.weekStart.localeCompare(a.weekStart),
  );
}

/**
 * The last `count` weeks up to and including the week of `today`, newest first.
 * Weeks without training are included with zeros, so the chart shows rest weeks too.
 */
export function lastWeeks(
  weeks: WeekTotals[],
  today: string,
  count: number,
  weekStartDay: WeekStartDay = "monday",
): WeekTotals[] {
  const byStart = new Map(weeks.map((week) => [week.weekStart, week]));
  const current = new Date(`${weekStartOf(today, weekStartDay)}T00:00:00Z`);

  return Array.from({ length: count }, (_, i) => {
    const start = new Date(current.getTime() - i * 7 * DAY_MS)
      .toISOString()
      .slice(0, 10);
    return byStart.get(start) ?? emptyWeek(start);
  });
}

export const AVERAGE_PERIODS = ["4w", "3m", "6m", "1y", "all"] as const;
export type AveragePeriod = (typeof AVERAGE_PERIODS)[number];

const PERIOD_WEEKS: Record<Exclude<AveragePeriod, "all">, number> = {
  "4w": 4,
  "3m": 13,
  "6m": 26,
  "1y": 52,
};

export type AverageWeek = {
  /** Number of weeks the average is taken over (rest weeks count too). */
  weeks: number;
  seconds: SportTotals;
  meters: SportTotals;
};

/**
 * Average week per sport over a period (HOME-3). The current week is excluded, since it isn't finished.
 * "all" starts at the week of the first activity.
 */
export function averageWeek(
  weeks: WeekTotals[],
  today: string,
  period: AveragePeriod,
  weekStartDay: WeekStartDay = "monday",
): AverageWeek {
  const currentWeek = weekStartOf(today, weekStartDay);
  const finished = weeks.filter((week) => week.weekStart < currentWeek);

  let weekCount: number;
  if (period === "all") {
    const oldest = finished.at(-1)?.weekStart;
    weekCount = oldest
      ? Math.round(
          (Date.parse(`${currentWeek}T00:00:00Z`) -
            Date.parse(`${oldest}T00:00:00Z`)) /
            (7 * DAY_MS),
        )
      : 0;
  } else {
    weekCount = PERIOD_WEEKS[period];
  }

  const firstIncluded = new Date(
    Date.parse(`${currentWeek}T00:00:00Z`) - weekCount * 7 * DAY_MS,
  )
    .toISOString()
    .slice(0, 10);
  const inPeriod = finished.filter((week) => week.weekStart >= firstIncluded);

  const seconds = emptyTotals();
  const meters = emptyTotals();
  for (const week of inPeriod) {
    for (const sport of SPORTS) {
      seconds[sport] += week.seconds[sport];
      meters[sport] += week.meters[sport];
    }
  }
  if (weekCount > 0) {
    for (const sport of SPORTS) {
      seconds[sport] /= weekCount;
      meters[sport] /= weekCount;
    }
  }

  return { weeks: weekCount, seconds, meters };
}
