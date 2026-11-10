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

export type MonthTotals = { month: string; totals: Totals };

export type Calendar = {
  period: CalendarPeriod;
  weeks: CalendarWeek[];
  /** Only days inside the period (HOME-5). */
  totals: Totals;
  /** Per month, only days inside the period (for the week overview). */
  months: MonthTotals[];
  /** Weeks shown that are over (the current week isn't finished, H6). */
  finishedWeeks: number;
  /** The average of the finished weeks, or null when none is finished (H5, H6). */
  weeklyAverage: Totals | null;
  density: Density;
};

/** Average of week totals: every number divided by the number of weeks. */
export function averageTotals(weeks: Totals[]): Totals | null {
  if (weeks.length === 0) return null;
  const sum = emptyCalendarTotals();
  for (const week of weeks) {
    for (const sport of Object.keys(
      sum.seconds,
    ) as (keyof Totals["seconds"])[]) {
      sum.seconds[sport] += week.seconds[sport];
      sum.meters[sport] += week.meters[sport];
    }
    sum.totalSeconds += week.totalSeconds;
    sum.count += week.count;
  }
  for (const sport of Object.keys(sum.seconds) as (keyof Totals["seconds"])[]) {
    sum.seconds[sport] /= weeks.length;
    sum.meters[sport] /= weeks.length;
  }
  sum.totalSeconds /= weeks.length;
  sum.count /= weeks.length;
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
  const monthTotals = new Map<string, Totals>();
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
        if (inPeriod) {
          add(totals, activity);
          const month = monthOf(date);
          const forMonth = monthTotals.get(month) ?? emptyCalendarTotals();
          add(forMonth, activity);
          monthTotals.set(month, forMonth);
        }
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

  // Averages use finished weeks only: the current week isn't over yet (H6).
  const finished = weeks.filter((week) => week.days[6].date < todayDate);
  const months: MonthTotals[] = [];
  for (
    let month = monthOf(period.from);
    month <= monthOf(period.to);
    month = addMonths(month, 1)
  ) {
    months.push({
      month,
      totals: monthTotals.get(month) ?? emptyCalendarTotals(),
    });
  }

  return {
    period,
    weeks,
    totals,
    months,
    finishedWeeks: finished.length,
    weeklyAverage: averageTotals(finished.map((week) => week.totals)),
    density: densityFor(weeks.length),
  };
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
