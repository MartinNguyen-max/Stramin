import {
  addDays,
  addMonths,
  daysBetween,
  firstDayOfMonth,
  isValidDate,
  isValidMonth,
  lastDayOfMonth,
  monthOf,
} from "@/lib/dates";
import type { Sport } from "./sports";
import {
  emptyTotals,
  type SportTotals,
  type WeekStartDay,
  weekStartOf,
} from "./weekly";

/** The period types of the Home calendar (HOME-6). */
export const CALENDAR_VIEWS = [
  "1m",
  "3m",
  "6m",
  "1y",
  "custom",
  "all",
] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

/** Number of months shown by the preset views. */
export const VIEW_MONTHS = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 } as const;
type PresetView = keyof typeof VIEW_MONTHS;

function isPreset(view: CalendarView): view is PresetView {
  return view in VIEW_MONTHS;
}

/** Custom periods are capped at ~10 years, so a typo can't build a giant page. */
const MAX_CUSTOM_DAYS = 3660;

/** One workout as the calendar needs it. */
export type CalendarActivity = {
  id: string;
  name: string;
  sport: Sport;
  /** Local start time, e.g. Strava's `start_date_local` ("2026-11-02T07:15:00Z"). */
  startLocal: string;
  movingSeconds: number;
  distanceMeters: number;
  indoor: boolean;
};

/** What the user asked for, from the URL or the saved preference. */
export type CalendarRequest = {
  view: CalendarView;
  /** The last month of a 1m/3m/6m/1y window ("YYYY-MM"). Defaults to the current month. */
  month?: string;
  /** Custom period, "YYYY-MM-DD". */
  from?: string;
  to?: string;
};

/** A request resolved into concrete dates (both inclusive). */
export type CalendarPeriod = {
  view: CalendarView;
  from: string;
  to: string;
  /** The last month of a 1m/3m/6m/1y window. */
  endMonth?: string;
};

/** Turns a request into dates. Invalid or incomplete input falls back to the current month. */
export function resolvePeriod(
  request: CalendarRequest,
  todayDate: string,
  firstActivityDate?: string,
): CalendarPeriod {
  const currentMonth = monthOf(todayDate);

  if (request.view === "all") {
    const from =
      firstActivityDate && firstActivityDate <= todayDate
        ? firstActivityDate
        : firstDayOfMonth(currentMonth);
    return { view: "all", from, to: todayDate };
  }

  if (request.view === "custom") {
    const { from, to } = request;
    if (from && to && isValidDate(from) && isValidDate(to) && from <= to) {
      const cappedFrom =
        daysBetween(from, to) > MAX_CUSTOM_DAYS
          ? addDays(to, -MAX_CUSTOM_DAYS)
          : from;
      return { view: "custom", from: cappedFrom, to };
    }
    return resolvePeriod({ view: "1m" }, todayDate);
  }

  const months = VIEW_MONTHS[request.view];
  const endMonth =
    request.month &&
    isValidMonth(request.month) &&
    request.month <= currentMonth
      ? request.month
      : currentMonth;
  return {
    view: request.view,
    from: firstDayOfMonth(addMonths(endMonth, -(months - 1))),
    to: lastDayOfMonth(endMonth),
    endMonth,
  };
}

/**
 * The request for the window one month earlier (-1) or later (+1), or null when the view can't move or
 * would end in the future. All presets move by one month (owner feedback 2026-11-10, H9).
 */
export function shiftPeriod(
  period: CalendarPeriod,
  direction: -1 | 1,
  todayDate: string,
): CalendarRequest | null {
  if (!isPreset(period.view) || !period.endMonth) return null;
  const month = addMonths(period.endMonth, direction);
  if (month > monthOf(todayDate)) return null;
  return { view: period.view, month };
}

/** True when the period contains today (so "Today" has nothing to jump to). */
export function containsToday(
  period: CalendarPeriod,
  todayDate: string,
): boolean {
  return period.from <= todayDate && todayDate <= period.to;
}

/** First and last visible day: the period padded to whole weeks. Activities are fetched for this range (HOME-10). */
export function visibleRange(
  period: CalendarPeriod,
  weekStartDay: WeekStartDay,
): { from: string; to: string } {
  return {
    from: weekStartOf(period.from, weekStartDay),
    to: addDays(weekStartOf(period.to, weekStartDay), 6),
  };
}

/**
 * Week number of the week starting on `weekStart`.
 * Monday start: ISO 8601 (week 1 contains the first Thursday). Sunday start: US style (week 1 contains January 1).
 */
export function weekNumber(
  weekStart: string,
  weekStartDay: WeekStartDay,
): number {
  if (weekStartDay === "monday") {
    const year = addDays(weekStart, 3).slice(0, 4);
    const week1 = weekStartOf(`${year}-01-04`, "monday");
    return daysBetween(week1, weekStart) / 7 + 1;
  }
  const year = addDays(weekStart, 6).slice(0, 4);
  const week1 = weekStartOf(`${year}-01-01`, "sunday");
  return daysBetween(week1, weekStart) / 7 + 1;
}

/**
 * How the period is shown (HOME-7): the full calendar up to ~3 months, a week-by-week overview for
 * longer periods (owner feedback 2026-11-10, H7/H8).
 */
export type Density = "detailed" | "weeks";

export function densityFor(weekCount: number): Density {
  return weekCount <= 15 ? "detailed" : "weeks";
}

export type Totals = {
  seconds: SportTotals;
  meters: SportTotals;
  totalSeconds: number;
  count: number;
};

export function emptyCalendarTotals(): Totals {
  return {
    seconds: emptyTotals(),
    meters: emptyTotals(),
    totalSeconds: 0,
    count: 0,
  };
}

function add(totals: Totals, activity: CalendarActivity) {
  totals.seconds[activity.sport] += activity.movingSeconds;
  totals.meters[activity.sport] += activity.distanceMeters;
  totals.totalSeconds += activity.movingSeconds;
  totals.count += 1;
}

export type CalendarDay = {
  date: string;
  inPeriod: boolean;
  isToday: boolean;
  isFuture: boolean;
  activities: CalendarActivity[];
};

export type CalendarWeek = {
  start: string;
  number: number;
  days: CalendarDay[];
  /** The whole week, also days outside the period (HOME-4). */
  totals: Totals;
  /** Months that start in this week (or the period's first month, in the first week). Used as labels. */
  months: string[];
};

/**
 * A month in the week overview (owner feedback 2026-11-11, C3): its weeks, and their average week.
 * A week belongs to the month that holds most of its days (its 4th day); weeks at the edges of the
 * period go to its first or last month. Weeks that haven't started yet are left out.
 */
export type MonthGroup = {
  month: string;
  weeks: CalendarWeek[];
  /** The month's average week (`averageWeek`), or null before any day of it counts. */
  average: Totals | null;
};

export type Calendar = {
  period: CalendarPeriod;
  weeks: CalendarWeek[];
  /**
   * All days of the weeks shown, like the week totals and the average week, so the numbers always
   * match the rows on screen (HOME-5, owner feedback 2026-11-12).
   */
  totals: Totals;
  /** The weeks grouped by month, with each month's average week (for the week overview). */
  groups: MonthGroup[];
  /** Weeks shown that are over. */
  finishedWeeks: number;
  /**
   * The week with today, when it's shown, and which day of it today is (1–7). Shown on its own as
   * "this week so far" (owner feedback 2026-11-12); it joins the averages once it's over.
   */
  currentWeek: {
    week: CalendarWeek;
    day: number;
    /**
     * A usual day: the seconds the finished weeks shown had on average on each weekday (7 numbers, in
     * week order). Null without a finished week.
     */
    usualDays: number[] | null;
    /** The usual seconds by today (the sum of `usualDays` up to `day`), or null. */
    averageSoFar: number | null;
  } | null;
  /** The average of the finished weeks shown (`averageWeek`), or null when none is finished (H5, H6). */
  weeklyAverage: Totals | null;
  density: Density;
};

function isFinished(week: CalendarWeek, todayDate: string): boolean {
  return week.days[6].date < todayDate;
}

/** Training seconds of one day. */
export function daySeconds(day: CalendarDay): number {
  return day.activities.reduce(
    (sum, activity) => sum + activity.movingSeconds,
    0,
  );
}

/**
 * The current week and how it compares (owner feedback 2026-11-12): the finished weeks' usual day per
 * weekday, so heavy weekends don't make every Monday look low.
 */
function currentWeekOf(
  current: CalendarWeek,
  weeks: CalendarWeek[],
  todayDate: string,
): Calendar["currentWeek"] {
  const day = current.days.findIndex((d) => d.date === todayDate) + 1;
  const finished = weeks.filter((week) => isFinished(week, todayDate));
  if (finished.length === 0) {
    return { week: current, day, usualDays: null, averageSoFar: null };
  }
  const usualDays = current.days.map(
    (_, index) =>
      finished.reduce((sum, week) => sum + daySeconds(week.days[index]), 0) /
      finished.length,
  );
  const averageSoFar = usualDays
    .slice(0, day)
    .reduce((sum, seconds) => sum + seconds, 0);
  return { week: current, day, usualDays, averageSoFar };
}

/**
 * The average week: the totals of the finished weeks divided by their number (H6). The current week
 * isn't in it until it's over; it's shown on its own instead (owner feedback 2026-11-12, after trying
 * "days so far": with heavy weekends that average dipped every Monday). Null when none is finished.
 */
export function averageWeek(
  weeks: CalendarWeek[],
  todayDate: string,
): Totals | null {
  const sum = emptyCalendarTotals();
  let weight = 0;
  for (const week of weeks) {
    if (!isFinished(week, todayDate)) continue;
    weight += 1;
    for (const sport of Object.keys(sum.seconds) as Sport[]) {
      sum.seconds[sport] += week.totals.seconds[sport];
      sum.meters[sport] += week.totals.meters[sport];
    }
    sum.totalSeconds += week.totals.totalSeconds;
    sum.count += week.totals.count;
  }
  if (weight === 0) return null;
  for (const sport of Object.keys(sum.seconds) as Sport[]) {
    sum.seconds[sport] /= weight;
    sum.meters[sport] /= weight;
  }
  sum.totalSeconds /= weight;
  sum.count /= weight;
  return sum;
}

/** Builds the week rows of the calendar (HOME-2..5). */
export function buildCalendar(
  activities: CalendarActivity[],
  period: CalendarPeriod,
  weekStartDay: WeekStartDay,
  todayDate: string,
): Calendar {
  const range = visibleRange(period, weekStartDay);

  const byDate = new Map<string, CalendarActivity[]>();
  for (const activity of activities) {
    const date = activity.startLocal.slice(0, 10);
    if (date < range.from || date > range.to) continue;
    const list = byDate.get(date) ?? [];
    list.push(activity);
    byDate.set(date, list);
  }
  for (const list of byDate.values()) {
    list.sort((a, b) => a.startLocal.localeCompare(b.startLocal));
  }

  const totals = emptyCalendarTotals();
  const weeks: CalendarWeek[] = [];

  for (let start = range.from; start <= range.to; start = addDays(start, 7)) {
    const weekTotals = emptyCalendarTotals();
    const months: string[] = [];
    const days: CalendarDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i);
      const inPeriod = date >= period.from && date <= period.to;
      const dayActivities = byDate.get(date) ?? [];
      for (const activity of dayActivities) {
        add(weekTotals, activity);
        add(totals, activity);
      }
      if (inPeriod && (date.endsWith("-01") || date === period.from)) {
        const month = monthOf(date);
        if (!months.includes(month)) months.push(month);
      }
      days.push({
        date,
        inPeriod,
        isToday: date === todayDate,
        isFuture: date > todayDate,
        activities: dayActivities,
      });
    }

    weeks.push({
      start,
      number: weekNumber(start, weekStartDay),
      days,
      totals: weekTotals,
      months,
    });
  }

  const current = weeks.find((week) =>
    week.days.some((day) => day.date === todayDate),
  );

  return {
    period,
    weeks,
    totals,
    groups: groupByMonth(weeks, period, todayDate),
    finishedWeeks: weeks.filter((week) => isFinished(week, todayDate)).length,
    currentWeek: current ? currentWeekOf(current, weeks, todayDate) : null,
    weeklyAverage: averageWeek(weeks, todayDate),
    density: densityFor(weeks.length),
  };
}

/** The weeks by month, each month with its average week (C3). See `MonthGroup`. */
function groupByMonth(
  weeks: CalendarWeek[],
  period: CalendarPeriod,
  todayDate: string,
): MonthGroup[] {
  const first = monthOf(period.from);
  const last = monthOf(period.to);
  const groups: MonthGroup[] = [];
  for (const week of weeks) {
    if (week.days[0].date > todayDate) continue;
    const middle = monthOf(week.days[3].date);
    const month = middle < first ? first : middle > last ? last : middle;
    let group = groups.at(-1);
    if (group?.month !== month) {
      group = { month, weeks: [], average: null };
      groups.push(group);
    }
    group.weeks.push(week);
  }
  for (const group of groups) {
    group.average = averageWeek(group.weeks, todayDate);
  }
  return groups;
}

/** Reads a calendar request from URL search params. Returns null when no valid view is given. */
export function parseCalendarRequest(
  params: Record<string, string | string[] | undefined>,
): CalendarRequest | null {
  const first = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const view = first("view");
  if (!view || !(CALENDAR_VIEWS as readonly string[]).includes(view)) {
    return null;
  }
  return {
    view: view as CalendarView,
    month: first("month"),
    from: first("from"),
    to: first("to"),
  };
}

/** The URL query for a request (without empty values). */
export function calendarQuery(
  request: CalendarRequest,
): Record<string, string> {
  const query: Record<string, string> = { view: request.view };
  if (request.month) query.month = request.month;
  if (request.from) query.from = request.from;
  if (request.to) query.to = request.to;
  return query;
}
