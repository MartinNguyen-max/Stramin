import { useFormatter, useTranslations } from "next-intl";
import { DISTANCE_SPORTS, SPORT_BG } from "@/features/activities/sport-style";
import type { Calendar, CalendarDay, Totals } from "@/lib/analytics/calendar";
import { SPORTS, type Sport } from "@/lib/analytics/sports";
import { addDays, toDisplayDate } from "@/lib/dates";
import { formatDuration, formatSportDistance } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { DetailedChip } from "./activity-chip";
import { CalendarLink } from "./calendar-shell";
import { MobileCalendar } from "./mobile-calendar";
import { SportBar, SportLineText, sportLines } from "./sport-lines";

type CalendarProps = { calendar: Calendar; units: Units };

/** Week number · 7 days · week total. */
const GRID = "grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))_10rem]";

/**
 * The training calendar (HOME-2..9). Up to ~3 months: a real calendar (a grid on desktop, a tappable
 * month grid on phones). Longer periods: a week-by-week overview with numbers (owner feedback H7–H10).
 */
export function TrainingCalendar({ calendar, units }: CalendarProps) {
  return (
    <div className="flex flex-col gap-4">
      {calendar.density === "detailed" ? (
        <>
          <div className="hidden md:block">
            <DesktopGrid calendar={calendar} units={units} />
          </div>
          <div className="md:hidden">
            <MobileCalendar
              key={calendar.period.from}
              weeks={calendar.weeks}
              units={units}
              multiMonth={calendar.period.view !== "1m"}
            />
          </div>
        </>
      ) : (
        <WeekOverview calendar={calendar} units={units} />
      )}
      <PeriodTotals calendar={calendar} units={units} />
    </div>
  );
}

/* ---------------------------------------------------------- Desktop grid */

function DesktopGrid({ calendar, units }: CalendarProps) {
  const t = useTranslations("Calendar");
  const format = useFormatter();
  const firstWeek = calendar.weeks[0];
  const multiMonth = calendar.period.view !== "1m";

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div
        className={cn(
          GRID,
          "border-b bg-muted/50 text-xs font-medium text-muted-foreground",
        )}
      >
        <div className="px-2 py-2">{t("week")}</div>
        {firstWeek.days.map((day) => (
          <div key={day.date} className="px-2 py-2">
            {format.dateTime(toDisplayDate(day.date), { weekday: "short" })}
          </div>
        ))}
        <div className="px-2 py-2">{t("weekTotal")}</div>
      </div>
      {calendar.weeks.map((week) => (
        <div
          key={week.start}
          className={cn(
            GRID,
            "min-h-28 border-b last:border-b-0",
            multiMonth &&
              week.months.length > 0 &&
              "border-t-2 border-t-foreground/15 first-of-type:border-t-0",
          )}
        >
          <div className="flex min-w-0 flex-col gap-0.5 border-r px-2 py-1.5 text-xs">
            <span
              className="font-semibold text-muted-foreground tabular-nums"
              title={t("weekNumber", { number: week.number })}
            >
              {week.number}
            </span>
            {multiMonth &&
              week.months.map((month) => (
                <CalendarLink
                  key={month}
                  query={{ view: "1m", month }}
                  title={t("openMonth")}
                  className="truncate font-semibold text-foreground underline-offset-2 hover:underline"
                >
                  {format.dateTime(toDisplayDate(`${month}-01`), {
                    month: "short",
                  })}
                </CalendarLink>
              ))}
          </div>
          {week.days.map((day) => (
            <DayCell key={day.date} day={day} units={units} />
          ))}
          <WeekTotalCell totals={week.totals} units={units} />
        </div>
      ))}
    </div>
  );
}

function DayCell({ day, units }: { day: CalendarDay; units: Units }) {
  const format = useFormatter();
  const isFirstOfMonth = day.date.endsWith("-01");
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col gap-1 border-r p-1",
        !day.inPeriod && "bg-muted/40",
        day.isToday && "z-10 ring-2 ring-foreground ring-inset",
      )}
    >
      <span
        className={cn(
          "px-0.5 text-xs tabular-nums",
          day.inPeriod ? "text-foreground" : "text-muted-foreground",
          day.isToday && "font-bold",
          isFirstOfMonth && "font-semibold",
        )}
      >
        {isFirstOfMonth
          ? format.dateTime(toDisplayDate(day.date), {
              day: "numeric",
              month: "short",
            })
          : Number(day.date.slice(8))}
      </span>
      {day.activities.map((activity) => (
        <DetailedChip key={activity.id} activity={activity} units={units} />
      ))}
    </div>
  );
}

/** Total hours, then each sport's time and distance (HOME-4, H4). */
function WeekTotalCell({ totals, units }: { totals: Totals; units: Units }) {
  const t = useTranslations("Calendar");
  if (totals.count === 0) {
    return (
      <div className="bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground">
        –
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-1 bg-muted/30 px-2 py-1.5 text-xs">
      <span className="font-semibold tabular-nums">
        {formatDuration(totals.totalSeconds)} {t("hoursShort")}
      </span>
      <SportBar totals={totals} className="h-1.5" />
      {sportLines(totals, units).map((line) => (
        <SportLineText key={line.sport} line={line} />
      ))}
    </div>
  );
}

/* --------------------------------------------- Week overview (6M, 1Y, …) */

/** The main sports always, "other" only when there is some. */
function shownSports(totals: Totals): Sport[] {
  return SPORTS.filter(
    (sport) => sport !== "other" || totals.seconds.other > 0,
  );
}

/**
 * Long periods: one row per week with numbers per sport, and a header per month with its totals
 * (owner feedback H8: easy to compare week to week).
 */
function WeekOverview({ calendar, units }: CalendarProps) {
  const t = useTranslations("Calendar");
  const tSports = useTranslations("Activities.sports");
  const format = useFormatter();
  const sports = shownSports(calendar.totals);
  const maxSeconds = Math.max(
    1,
    ...calendar.weeks.map((week) => week.totals.totalSeconds),
  );
  const gridTemplateColumns = `8.5rem 9rem repeat(${sports.length}, minmax(0, 1fr))`;
  const monthTotals = new Map(
    calendar.months.map((entry) => [entry.month, entry.totals]),
  );

  return (
    <>
      {/* Desktop: a table. */}
      <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
        <div
          className="grid border-b bg-muted/50 text-xs font-medium text-muted-foreground"
          style={{ gridTemplateColumns }}
        >
          <div className="px-3 py-2">{t("week")}</div>
          <div className="px-3 py-2">{t("total")}</div>
          {sports.map((sport) => (
            <div key={sport} className="flex items-center gap-1.5 px-3 py-2">
              <span className={cn("size-2 rounded-full", SPORT_BG[sport])} />
              {tSports(sport)}
            </div>
          ))}
        </div>
        {calendar.weeks.map((week) => (
          <div key={week.start}>
            {week.months.map((month) => (
              <MonthHeader
                key={month}
                month={month}
                totals={monthTotals.get(month)}
                units={units}
              />
            ))}
            <div
              className={cn(
                "grid items-center border-b text-xs",
                week.days.some((day) => day.isToday) && "bg-muted/60",
                week.days[0].isFuture && "opacity-40",
              )}
              style={{ gridTemplateColumns }}
            >
              <div className="flex flex-col px-3 py-2">
                <span className="font-semibold">
                  {t("weekNumber", { number: week.number })}
                </span>
                <span className="text-muted-foreground">
                  {format.dateTimeRange(
                    toDisplayDate(week.start),
                    toDisplayDate(addDays(week.start, 6)),
                    { day: "numeric", month: "short" },
                  )}
                </span>
              </div>
              <div className="flex flex-col gap-1 px-3 py-2">
                <span className="font-semibold tabular-nums">
                  {week.totals.count > 0
                    ? `${formatDuration(week.totals.totalSeconds)} ${t("hoursShort")}`
                    : "–"}
                </span>
                <SportBar
                  totals={week.totals}
                  className="h-1.5"
                  widthPercent={(week.totals.totalSeconds / maxSeconds) * 100}
                />
              </div>
              {sports.map((sport) => (
                <SportCell
                  key={sport}
                  sport={sport}
                  totals={week.totals}
                  units={units}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Phone: one card per week. */}
      <ol className="flex flex-col gap-2 md:hidden">
        {calendar.weeks
          .filter((week) => !week.days[0].isFuture)
          .map((week) => (
            <li key={week.start} className="flex flex-col gap-2">
              {week.months.map((month) => (
                <MonthHeader
                  key={month}
                  month={month}
                  totals={monthTotals.get(month)}
                  units={units}
                  compact
                />
              ))}
              <div
                className={cn(
                  "flex flex-col gap-1.5 rounded-xl border bg-card px-3 py-2",
                  week.days.some((day) => day.isToday) &&
                    "ring-2 ring-foreground",
                )}
              >
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold">
                    {t("weekNumber", { number: week.number })}
                    <span className="font-normal text-muted-foreground">
                      {" · "}
                      {format.dateTimeRange(
                        toDisplayDate(week.start),
                        toDisplayDate(addDays(week.start, 6)),
                        { day: "numeric", month: "short" },
                      )}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">
                    {week.totals.count > 0
                      ? `${formatDuration(week.totals.totalSeconds)} ${t("hoursShort")}`
                      : "–"}
                  </span>
                </div>
                <SportBar
                  totals={week.totals}
                  className="h-1.5"
                  widthPercent={(week.totals.totalSeconds / maxSeconds) * 100}
                />
                {week.totals.count > 0 && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                    {sportLines(week.totals, units).map((line) => (
                      <SportLineText key={line.sport} line={line} />
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
      </ol>
    </>
  );
}

function SportCell({
  sport,
  totals,
  units,
}: {
  sport: Sport;
  totals: Totals;
  units: Units;
}) {
  if (totals.seconds[sport] === 0) {
    return <div className="px-3 py-2 text-muted-foreground">–</div>;
  }
  const distance =
    (DISTANCE_SPORTS as readonly Sport[]).includes(sport) &&
    totals.meters[sport] > 0
      ? formatSportDistance(sport, totals.meters[sport], units)
      : null;
  return (
    <div className="flex flex-col px-3 py-2 tabular-nums">
      <span className="font-medium">
        {formatDuration(totals.seconds[sport])}
      </span>
      {distance && <span className="text-muted-foreground">{distance}</span>}
    </div>
  );
}

function MonthHeader({
  month,
  totals,
  units,
  compact = false,
}: {
  month: string;
  totals: Totals | undefined;
  units: Units;
  compact?: boolean;
}) {
  const t = useTranslations("Calendar");
  const format = useFormatter();
  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1",
        compact
          ? "px-1 pt-2 text-sm"
          : "border-b bg-muted/30 px-3 py-2 text-xs",
      )}
    >
      <CalendarLink
        query={{ view: "1m", month }}
        title={t("openMonth")}
        className="font-semibold underline-offset-2 first-letter:uppercase hover:underline"
      >
        {format.dateTime(toDisplayDate(`${month}-01`), {
          month: "long",
          year: "numeric",
        })}
      </CalendarLink>
      {totals && totals.count > 0 && (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">
            {formatDuration(totals.totalSeconds)} {t("hoursShort")}
          </span>
          {!compact &&
            sportLines(totals, units).map((line) => (
              <SportLineText key={line.sport} line={line} />
            ))}
        </span>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- Period total */

/** Totals for the period, and the average of the finished weeks (HOME-5, H5, H6). */
function PeriodTotals({ calendar, units }: CalendarProps) {
  const t = useTranslations("Calendar");
  const tSports = useTranslations("Activities.sports");
  const { totals, weeklyAverage, finishedWeeks } = calendar;
  const sports = shownSports(totals);
  const averages = weeklyAverage ? sportLines(weeklyAverage, units) : [];

  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-semibold">{t("periodTotal")}</h3>
        <p className="text-sm text-muted-foreground tabular-nums">
          {t("workouts", { count: totals.count })}
          {" · "}
          <span className="font-semibold text-foreground">
            {formatDuration(totals.totalSeconds)} {t("hoursShort")}
          </span>
        </p>
      </div>

      {weeklyAverage && (
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="text-muted-foreground">{t("averageWeek")}</span>
          <span className="text-lg font-semibold tabular-nums">
            {formatDuration(weeklyAverage.totalSeconds)} {t("hoursShort")}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {t("workoutsPerWeek", {
              count: Math.round(weeklyAverage.count * 10) / 10,
            })}
          </span>
        </p>
      )}

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {sports.map((sport) => {
          const isDistance =
            (DISTANCE_SPORTS as readonly Sport[]).includes(sport) &&
            totals.meters[sport] > 0;
          const average = averages.find((line) => line.sport === sport);
          return (
            <li
              key={sport}
              className="flex flex-col gap-0.5 rounded-xl bg-muted/50 p-3"
            >
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("size-2 rounded-full", SPORT_BG[sport])} />
                {tSports(sport)}
              </span>
              <span className="text-lg font-semibold tabular-nums">
                {isDistance
                  ? formatSportDistance(sport, totals.meters[sport], units)
                  : totals.seconds[sport] > 0
                    ? `${formatDuration(totals.seconds[sport])} ${t("hoursShort")}`
                    : "–"}
              </span>
              {isDistance && (
                <span className="text-xs tabular-nums">
                  {formatDuration(totals.seconds[sport])} {t("hoursShort")}
                </span>
              )}
              {average && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t("perWeek", {
                    value: [average.time, average.distance]
                      .filter(Boolean)
                      .join(" · "),
                  })}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted-foreground">
        {weeklyAverage
          ? t("averageNote", { count: finishedWeeks })
          : t("noFinishedWeek")}
      </p>
    </section>
  );
}
