import { SPORTS, type Sport } from "./sports";

export type ActivityForWeekly = {
  sport: Sport;
  /** Local start time as an ISO string without a real offset (e.g. Strava's `start_date_local`). */
  startLocal: string;
  /** Duration in seconds. */
  durationSeconds: number;
};

export type WeekTotals = {
  /** Monday (or Sunday) of the week, as YYYY-MM-DD in the athlete's local time. */
  weekStart: string;
  seconds: Record<Sport, number>;
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

function emptySeconds(): Record<Sport, number> {
  return Object.fromEntries(SPORTS.map((sport) => [sport, 0])) as Record<
    Sport,
    number
  >;
}

/** Sums training time per sport per week (HOME-1, HOME-2). Newest week first. Weeks without training are omitted. */
export function weeklyTotals(
  activities: ActivityForWeekly[],
  weekStartDay: WeekStartDay = "monday",
): WeekTotals[] {
  const weeks = new Map<string, WeekTotals>();

  for (const activity of activities) {
    const weekStart = weekStartOf(activity.startLocal, weekStartDay);
    let week = weeks.get(weekStart);
    if (!week) {
      week = { weekStart, seconds: emptySeconds(), totalSeconds: 0 };
      weeks.set(weekStart, week);
    }
    week.seconds[activity.sport] += activity.durationSeconds;
    week.totalSeconds += activity.durationSeconds;
  }

  return [...weeks.values()].sort((a, b) =>
    b.weekStart.localeCompare(a.weekStart),
  );
}
