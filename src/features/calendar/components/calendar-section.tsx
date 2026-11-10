import { cookies } from "next/headers";
import { connection } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import {
  buildCalendar,
  type CalendarActivity,
  type CalendarPeriod,
  type CalendarRequest,
  calendarQuery,
  containsToday,
  parseCalendarRequest,
  resolvePeriod,
  shiftPeriod,
  visibleRange,
} from "@/lib/analytics/calendar";
import type { WeekStartDay } from "@/lib/analytics/weekly";
import { toDisplayDate, today as todayDate } from "@/lib/dates";
import type { Units } from "@/lib/preferences";
import { CALENDAR_COOKIE, parsePreference } from "../preference";
import { type CalendarBase, CalendarShell } from "./calendar-shell";
import { CalendarToolbar } from "./calendar-toolbar";
import { TrainingCalendar } from "./training-calendar";

/** Loads activities for a range of local days, or the full history without a range. Null = not connected. */
export type ActivityLoader = (range?: {
  from: string;
  to: string;
}) => Promise<CalendarActivity[] | null>;

/** Reads the period the user asked for: the URL first, then the saved preference, then "this month". */
export async function readCalendarRequest(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<CalendarRequest> {
  const fromUrl = parseCalendarRequest(searchParams);
  if (fromUrl) return fromUrl;
  const raw = (await cookies()).get(CALENDAR_COOKIE)?.value;
  let decoded = raw;
  try {
    decoded = raw ? decodeURIComponent(raw) : raw;
  } catch {
    // Keep the raw value; parsePreference ignores anything invalid.
  }
  return parsePreference(decoded) ?? { view: "1m" };
}

/**
 * The calendar with its toolbar (HOME-2..10). Fetches only the shown weeks, except for "all time".
 * Returns `notConnected` when the loader has no data source (no Strava connection).
 */
export async function CalendarSection({
  base,
  request,
  units,
  weekStart,
  load,
  notConnected,
}: {
  base: CalendarBase;
  request: CalendarRequest;
  units: Units;
  weekStart: WeekStartDay;
  load: ActivityLoader;
  notConnected: React.ReactNode;
}) {
  // The calendar depends on today's date, so it's always rendered per request.
  await connection();
  const today = todayDate();

  let period: CalendarPeriod;
  let activities: CalendarActivity[] | null;
  if (request.view === "all") {
    activities = await load();
    const first = activities
      ?.map((activity) => activity.startLocal.slice(0, 10))
      .sort()[0];
    period = resolvePeriod(request, today, first);
  } else {
    period = resolvePeriod(request, today);
    activities = await load(visibleRange(period, weekStart));
  }
  if (!activities) return notConnected;

  const calendar = buildCalendar(activities, period, weekStart, today);
  const label = await periodLabel(period);
  const prev = shiftPeriod(period, -1, today);
  const next = shiftPeriod(period, 1, today);
  const backToToday =
    !containsToday(period, today) &&
    period.view !== "custom" &&
    period.view !== "all"
      ? calendarQuery({ view: period.view })
      : undefined;

  return (
    <CalendarShell
      base={base}
      toolbar={
        <CalendarToolbar
          view={period.view}
          label={label}
          prev={prev ? calendarQuery(prev) : undefined}
          next={next ? calendarQuery(next) : undefined}
          today={backToToday}
          from={period.from}
          to={period.to > today ? today : period.to}
        />
      }
    >
      <TrainingCalendar calendar={calendar} units={units} />
    </CalendarShell>
  );
}

/** "November 2026", "Sep – Nov 2026", "5 Mar – 20 Apr 2026" or "All time (since Jun 2023)". */
async function periodLabel(period: CalendarPeriod): Promise<string> {
  const format = await getFormatter();
  const t = await getTranslations("Calendar");
  const from = toDisplayDate(period.from);
  const to = toDisplayDate(period.to);
  switch (period.view) {
    case "1m":
      return format.dateTime(from, { month: "long", year: "numeric" });
    case "all":
      return t("allTimeSince", {
        date: format.dateTime(from, { month: "short", year: "numeric" }),
      });
    case "custom":
      return format.dateTimeRange(from, to, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    default:
      return format.dateTimeRange(from, to, {
        month: "short",
        year: "numeric",
      });
  }
}
