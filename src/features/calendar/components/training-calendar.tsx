import { ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useHours } from "@/i18n/use-hours";
import type {
  Calendar,
  CalendarDay,
  CalendarWeek,
  MonthGroup,
  Totals,
} from "@/lib/analytics/calendar";
import { SPORTS, type Sport } from "@/lib/analytics/sports";
import { addDays, toDisplayDate } from "@/lib/dates";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { DetailedChip } from "./activity-chip";
import { CalendarLink } from "./calendar-shell";
import { MobileCalendar } from "./mobile-calendar";
import {
  SportBar,
  SportDistance,
  SportIcon,
  SportTimeLine,
  totalDistance,
  trainedSports,
} from "./sport-lines";

type CalendarProps = { calendar: Calendar; units: Units };

/** Week number · 7 days · week total. */
const GRID = "grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))_11rem]";

/**
 * How many months the week overview shows open; with more, only the newest month starts open and the
 * rest are folded to their average week (C4, M2). Phones have less room, so they fold sooner.
 */
const OPEN_MONTHS = { desktop: 13, phone: 7 };

/**
 * The training calendar (HOME-2..9). Up to ~3 months: a real calendar (a grid on desktop, a tappable
 * month grid on phones) with the average week below. Longer periods: the average week first, then the
 * weeks grouped by month (owner feedback 2026-11-11, C2–C4).
 */
export function TrainingCalendar({ calendar, units }: CalendarProps) {
  if (calendar.density === "weeks") {
    return (
      <div className="flex flex-col gap-4">
        <PeriodSummary calendar={calendar} units={units} />
        <WeekOverview calendar={calendar} units={units} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
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
      <PeriodSummary calendar={calendar} units={units} />
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

/** Total hours first, then per sport its icon, time and distance (HOME-4, C1). */
function WeekTotalCell({ totals, units }: { totals: Totals; units: Units }) {
  const hours = useHours();
  if (totals.count === 0) {
    return (
      <div className="bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground">
        –
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-1 bg-muted/30 px-2 py-1.5 text-xs">
      <span className="text-sm font-bold tabular-nums">
        {hours(totals.totalSeconds)}
      </span>
      <SportBar totals={totals} className="h-1.5" />
      {trainedSports(totals).map((sport) => (
        <SportTimeLine
          key={sport}
          sport={sport}
          totals={totals}
          units={units}
        />
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
 * Long periods (C3, C4): the weeks grouped by month. Each month shows its average week, each week its
 * hours and the distance per sport. Months fold open and closed.
 */
function WeekOverview({ calendar, units }: CalendarProps) {
  const sports = shownSports(calendar.totals);
  const maxSeconds = Math.max(
    1,
    ...calendar.weeks.map((week) => week.totals.totalSeconds),
  );
  const count = calendar.groups.length;
  const isOpen = (index: number, limit: number) =>
    count <= limit || index === count - 1;

  return (
    <>
      <OverviewTable
        calendar={calendar}
        units={units}
        sports={sports}
        maxSeconds={maxSeconds}
        isOpen={(index) => isOpen(index, OPEN_MONTHS.desktop)}
      />
      <div className="flex flex-col gap-3 md:hidden">
        {calendar.groups.map((group, index) => (
          <MonthCard
            key={group.month}
            group={group}
            units={units}
            maxSeconds={maxSeconds}
            open={isOpen(index, OPEN_MONTHS.phone)}
          />
        ))}
      </div>
    </>
  );
}

/** Desktop: one table, a folding header row per month, one row per week. */
function OverviewTable({
  calendar,
  units,
  sports,
  maxSeconds,
  isOpen,
}: CalendarProps & {
  sports: Sport[];
  maxSeconds: number;
  isOpen: (index: number) => boolean;
}) {
  const t = useTranslations("Calendar");
  const tSports = useTranslations("Activities.sports");
  const gridTemplateColumns = `13rem 8rem repeat(${sports.length}, minmax(0, 1fr))`;

  return (
    <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
      <div
        className="grid border-b bg-muted/50 text-xs font-medium text-muted-foreground"
        style={{ gridTemplateColumns }}
      >
        <div className="px-3 py-2">{t("week")}</div>
        <div className="px-3 py-2">{t("hours")}</div>
        {sports.map((sport) => (
          <div key={sport} className="flex items-center gap-1.5 px-3 py-2">
            <SportIcon sport={sport} />
            {tSports(sport)}
          </div>
        ))}
      </div>
      {calendar.groups.map((group, index) => (
        <details
          key={group.month}
          open={isOpen(index)}
          className="group/month border-b last:border-b-0"
        >
          <summary
            className="grid cursor-pointer list-none items-center bg-muted/40 text-sm hover:bg-muted/70 [&::-webkit-details-marker]:hidden"
            style={{ gridTemplateColumns }}
          >
            <div className="flex min-w-0 items-center gap-1.5 px-3 py-2">
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open/month:rotate-90" />
              <span className="flex min-w-0 flex-col">
                <MonthLink month={group.month} />
                <span className="text-xs text-muted-foreground">
                  {t("averageWeek")}
                </span>
              </span>
            </div>
            <div className="px-3 py-2 font-bold tabular-nums">
              <AverageHours group={group} />
            </div>
            {sports.map((sport) => (
              <div key={sport} className="px-3 py-2 font-semibold">
                {group.average ? (
                  <SportValue
                    sport={sport}
                    totals={group.average}
                    units={units}
                  />
                ) : (
                  "–"
                )}
              </div>
            ))}
          </summary>
          {group.weeks.map((week) => (
            <div
              key={week.start}
              className={cn(
                "grid items-center border-t text-xs",
                isCurrent(week) && "bg-muted/60",
              )}
              style={{ gridTemplateColumns }}
            >
              <WeekLabel week={week} className="px-3 py-1.5 pl-9" />
              <div className="flex flex-col gap-1 px-3 py-1.5">
                <WeekHours week={week} />
                <SportBar
                  totals={week.totals}
                  className="h-1"
                  widthPercent={(week.totals.totalSeconds / maxSeconds) * 100}
                />
              </div>
              {sports.map((sport) => (
                <div key={sport} className="px-3 py-1.5">
                  <SportValue
                    sport={sport}
                    totals={week.totals}
                    units={units}
                  />
                </div>
              ))}
            </div>
          ))}
        </details>
      ))}
    </div>
  );
}

/** Phone: a folding card per month with its average week, and two lines per week. */
function MonthCard({
  group,
  units,
  maxSeconds,
  open,
}: {
  group: MonthGroup;
  units: Units;
  maxSeconds: number;
  open: boolean;
}) {
  const t = useTranslations("Calendar");
  return (
    <details
      open={open}
      className="group/month overflow-hidden rounded-2xl border bg-card"
    >
      <summary className="flex cursor-pointer list-none flex-col gap-1.5 bg-muted/40 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open/month:rotate-90" />
            <MonthLink month={group.month} />
          </span>
          <span className="text-sm font-bold tabular-nums">
            <AverageHours group={group} />
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pl-5.5 text-xs">
          <span className="text-muted-foreground">{t("averageWeek")}</span>
          {group.average &&
            trainedSports(group.average).map((sport) => (
              <SportDistance
                key={sport}
                sport={sport}
                totals={group.average as Totals}
                units={units}
                className="font-medium"
              />
            ))}
        </span>
      </summary>
      <ol className="divide-y border-t">
        {group.weeks.map((week) => (
          <li
            key={week.start}
            className={cn(
              "flex flex-col gap-1 px-3 py-2",
              isCurrent(week) && "bg-muted/60",
            )}
          >
            <span className="flex items-baseline justify-between gap-2 text-sm">
              <WeekLabel week={week} />
              <span className="font-semibold">
                <WeekHours week={week} />
              </span>
            </span>
            <SportBar
              totals={week.totals}
              className="h-1"
              widthPercent={(week.totals.totalSeconds / maxSeconds) * 100}
            />
            {week.totals.count > 0 && (
              <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                {trainedSports(week.totals).map((sport) => (
                  <SportDistance
                    key={sport}
                    sport={sport}
                    totals={week.totals}
                    units={units}
                  />
                ))}
              </span>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}

function isCurrent(week: CalendarWeek): boolean {
  return week.days.some((day) => day.isToday);
}

function MonthLink({ month }: { month: string }) {
  const t = useTranslations("Calendar");
  const format = useFormatter();
  return (
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
  );
}

/** "Wk 45 · 2–8 Nov" */
function WeekLabel({
  week,
  className,
}: {
  week: CalendarWeek;
  className?: string;
}) {
  const t = useTranslations("Calendar");
  const format = useFormatter();
  return (
    <span className={cn("whitespace-nowrap tabular-nums", className)}>
      <span className="font-semibold">
        {t("week")} {week.number}
      </span>
      <span className="text-muted-foreground">
        {" · "}
        {format.dateTimeRange(
          toDisplayDate(week.start),
          toDisplayDate(addDays(week.start, 6)),
          { day: "numeric", month: "short" },
        )}
      </span>
    </span>
  );
}

function WeekHours({ week }: { week: CalendarWeek }) {
  const hours = useHours();
  return (
    <span className="tabular-nums">
      {week.totals.count > 0 ? hours(week.totals.totalSeconds) : "–"}
    </span>
  );
}

function AverageHours({ group }: { group: MonthGroup }) {
  const hours = useHours();
  return <>{group.average ? hours(group.average.totalSeconds) : "–"}</>;
}

/** A sport's distance in a table cell (time for strength), or "–". */
function SportValue({
  sport,
  totals,
  units,
}: {
  sport: Sport;
  totals: Totals;
  units: Units;
}) {
  const hours = useHours();
  if (totals.seconds[sport] === 0) {
    return <span className="text-muted-foreground">–</span>;
  }
  return (
    <span className="tabular-nums" title={hours(totals.seconds[sport])}>
      {totalDistance(sport, totals, units) ?? hours(totals.seconds[sport])}
    </span>
  );
}

/* ---------------------------------------------- Average week + period total */

/**
 * The average week is the main number, then the average per sport, then the period's total
 * (HOME-5, owner feedback C2). Averages use finished weeks only (H6).
 */
function PeriodSummary({ calendar, units }: CalendarProps) {
  const t = useTranslations("Calendar");
  const tSports = useTranslations("Activities.sports");
  const hours = useHours();
  const format = useFormatter();
  const { totals, weeklyAverage, finishedWeeks } = calendar;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t("averageWeek")}
        </h3>
        {weeklyAverage ? (
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-3xl font-bold tabular-nums">
              {hours(weeklyAverage.totalSeconds)}
            </span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {t("perWeekWorkouts", {
                count: format.number(weeklyAverage.count, {
                  maximumFractionDigits: 1,
                }),
              })}
            </span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noFinishedWeek")}</p>
        )}
      </div>

      {weeklyAverage && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {shownSports(totals).map((sport) => (
            <AverageCard
              key={sport}
              label={tSports(sport)}
              sport={sport}
              average={weeklyAverage}
              units={units}
            />
          ))}
        </ul>
      )}

      {weeklyAverage && (
        <p className="text-xs text-muted-foreground">
          {t("averageNote", { count: finishedWeeks })}
        </p>
      )}

      <div className="flex flex-col gap-1.5 border-t pt-3">
        <p className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
          <span className="font-medium">{t("periodTotal")}</span>
          <span className="text-muted-foreground tabular-nums">
            {t("workouts", { count: totals.count })}
            {totals.count > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-foreground">
                  {hours(totals.totalSeconds)}
                </span>
              </>
            )}
          </span>
        </p>
        {totals.count > 0 && (
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {trainedSports(totals).map((sport) => (
              <SportTimeLine
                key={sport}
                sport={sport}
                totals={totals}
                units={units}
              />
            ))}
          </p>
        )}
      </div>
    </section>
  );
}

/** One sport in the average week: distance per week first (time for strength), then hours per week. */
function AverageCard({
  label,
  sport,
  average,
  units,
}: {
  label: ReactNode;
  sport: Sport;
  average: Totals;
  units: Units;
}) {
  const hours = useHours();
  const distance = totalDistance(sport, average, units);
  const trained = average.seconds[sport] > 0;
  return (
    <li className="flex flex-col gap-0.5 rounded-xl bg-muted/50 p-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <SportIcon sport={sport} />
        {label}
      </span>
      <span className="text-lg font-semibold tabular-nums">
        {!trained ? "–" : (distance ?? hours(average.seconds[sport]))}
      </span>
      {trained && distance && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {hours(average.seconds[sport])}
        </span>
      )}
    </li>
  );
}
