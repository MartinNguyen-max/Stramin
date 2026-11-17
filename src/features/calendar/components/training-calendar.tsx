import { Check, TrendingDown, TrendingUp } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { InfoTip } from "@/components/ui/info-tip";
import { SPORT_BG, SPORT_TEXT } from "@/features/activities/sport-style";
import type { WeeklyGoal } from "@/features/goals/weekly";
import { Link } from "@/i18n/navigation";
import { useHours } from "@/i18n/use-hours";
import type {
  Calendar,
  CalendarDay,
  CalendarView,
  CalendarWeek,
  MonthGroup,
  Totals,
} from "@/lib/analytics/calendar";
import { SPORTS, type Sport } from "@/lib/analytics/sports";
import { toDisplayDate } from "@/lib/dates";
import { formatTotalDistance } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { type SportProgress, weekProgress } from "../week-progress";
import { DetailedChip } from "./activity-chip";
import { CalendarLink } from "./calendar-shell";
import { MobileCalendar } from "./mobile-calendar";
import {
  SportBar,
  SportIcon,
  SportLine,
  totalDistance,
  trainedSports,
} from "./sport-lines";
import { ThisWeekToggle } from "./this-week-toggle";

/** Where the weekly goal is set. */
export type GoalsHref = "/goals/weekly" | "/demo/goals/weekly";

type CalendarProps = { calendar: Calendar; units: Units };

/** Week number · 7 days · week total. */
const GRID = "grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))_11rem]";

/**
 * The training calendar (HOME-2..9). The average week always comes first (owner feedback 2026-11-12).
 * Up to ~3 months: a real calendar (a grid on desktop, a tappable month grid on phones). Longer
 * periods: a card per month with its average week and a bar per week (owner feedback 2026-11-12).
 */
export function TrainingCalendar({
  calendar,
  units,
  thisWeekOpen,
  rememberThisWeek = false,
  weeklyGoal = null,
  goalsHref,
}: CalendarProps & {
  /** The user's weekly goal; without it "This week" compares with the average week. */
  weeklyGoal?: WeeklyGoal | null;
  /** Where the weekly goal is set (the info button links there); none on the landing page. */
  goalsHref?: GoalsHref;
  /** Whether "This week" starts open (the saved choice, else open on 1M/3M). */
  thisWeekOpen?: boolean;
  /** Save when the user opens or closes "This week" (not on the landing page). */
  rememberThisWeek?: boolean;
}) {
  const { view } = calendar.period;
  return (
    <div className="flex flex-col gap-4">
      <PeriodSummary calendar={calendar} units={units} />
      {/* "This week" on every period, folding: open on 1M/3M by default (owner feedback 2026-11-15,
          replacing "1M only" from batch 6). */}
      <ThisWeekCard
        key={view}
        calendar={calendar}
        units={units}
        defaultOpen={thisWeekOpen ?? (view === "1m" || view === "3m")}
        view={rememberThisWeek ? view : undefined}
        weeklyGoal={weeklyGoal}
        goalsHref={goalsHref}
      />
      {calendar.density === "weeks" ? (
        <MonthCards calendar={calendar} units={units} />
      ) : (
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
      )}
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
        <SportLine key={sport} sport={sport} totals={totals} units={units} />
      ))}
    </div>
  );
}

/* ------------------------------------------- Month cards (6M, 1Y, all) */

/** The main sports always, "other" only when there is some. */
function shownSports(totals: Totals): Sport[] {
  return SPORTS.filter(
    (sport) => sport !== "other" || totals.seconds.other > 0,
  );
}

/**
 * Long periods: a card per month (owner feedback 2026-11-12, idea A) with its average week (hours and
 * every sport) and a small bar chart of its weeks. The bars share one scale across all months, so
 * weeks can be compared everywhere. A card opens its month.
 */
function MonthCards({ calendar, units }: CalendarProps) {
  const sports = shownSports(calendar.totals);
  const maxSeconds = Math.max(
    1,
    ...calendar.weeks.map((week) => week.totals.totalSeconds),
  );
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {calendar.groups.map((group) => (
        <li key={group.month}>
          <MonthCard
            group={group}
            sports={sports}
            units={units}
            maxSeconds={maxSeconds}
          />
        </li>
      ))}
    </ul>
  );
}

function MonthCard({
  group,
  sports,
  units,
  maxSeconds,
}: {
  group: MonthGroup;
  sports: Sport[];
  units: Units;
  maxSeconds: number;
}) {
  const t = useTranslations("Calendar");
  const format = useFormatter();
  const hours = useHours();
  const { average } = group;

  return (
    <CalendarLink
      query={{ view: "1m", month: group.month }}
      title={t("openMonth")}
      className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/40"
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-semibold first-letter:uppercase">
          {format.dateTime(toDisplayDate(`${group.month}-01`), {
            month: "long",
            year: "numeric",
          })}
        </span>
        <span className="text-xs text-muted-foreground">
          {t("averageWeek")}
        </span>
      </span>

      <span className="text-3xl font-bold tabular-nums">
        {average ? hours(average.totalSeconds) : "–"}
      </span>

      <span className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        {sports.map((sport) =>
          average && average.seconds[sport] > 0 ? (
            <SportLine
              key={sport}
              sport={sport}
              totals={average}
              units={units}
            />
          ) : (
            <span
              key={sport}
              className="flex items-center gap-1.5 text-muted-foreground"
            >
              <SportIcon sport={sport} />–
            </span>
          ),
        )}
      </span>

      <WeekBars weeks={group.weeks} maxSeconds={maxSeconds} />
    </CalendarLink>
  );
}

/** The tallest week's bar, in pixels. */
const BAR_PX = 44;

/**
 * One bar per week with its hours on top (owner feedback 2026-11-12): the height is the hours, split
 * into sport colors; the week number below.
 */
function WeekBars({
  weeks,
  maxSeconds,
}: {
  weeks: CalendarWeek[];
  maxSeconds: number;
}) {
  const t = useTranslations("Calendar");
  const hours = useHours();
  return (
    <span className="mt-auto flex items-end gap-1.5 border-t pt-3">
      {weeks.map((week) => {
        const { totals } = week;
        const current = week.days.some((day) => day.isToday);
        return (
          <span
            key={week.start}
            title={`${t("weekNumber", { number: week.number })}: ${hours(totals.totalSeconds)}`}
            className="flex min-w-0 flex-1 flex-col items-center gap-1"
          >
            <span className="flex h-[4.5rem] w-full flex-col items-center justify-end gap-0.5">
              <span
                className={cn(
                  "text-[11px] font-semibold tabular-nums",
                  totals.totalSeconds === 0 && "text-muted-foreground",
                )}
              >
                {totals.totalSeconds > 0 ? hours(totals.totalSeconds) : "–"}
              </span>
              {totals.totalSeconds > 0 ? (
                <span
                  className={cn(
                    "flex w-full flex-col-reverse overflow-hidden rounded-t-sm",
                    current && "opacity-50",
                  )}
                  style={{
                    height: `${Math.max(3, (totals.totalSeconds / maxSeconds) * BAR_PX)}px`,
                  }}
                >
                  {SPORTS.map((sport) =>
                    totals.seconds[sport] > 0 ? (
                      <span
                        key={sport}
                        className={SPORT_BG[sport]}
                        style={{
                          height: `${(totals.seconds[sport] / totals.totalSeconds) * 100}%`,
                        }}
                      />
                    ) : null,
                  )}
                </span>
              ) : (
                <span className="h-0.5 w-full rounded-full bg-muted" />
              )}
            </span>
            <span
              className={cn(
                "text-[10px] text-muted-foreground tabular-nums",
                current && "font-bold text-foreground",
              )}
            >
              {week.number}
            </span>
          </span>
        );
      })}
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
  const { totals, weeklyAverage, finishedWeeks } = calendar;
  const sports = shownSports(totals);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        {t("averageWeekPeriod")}
      </h3>

      {weeklyAverage ? (
        // One row of grey cards on wide screens (owner feedback 2026-11-12): the total hours largest,
        // then each sport's distance in its color and its hours per week. On phones the total gets its
        // own line and the sports sit side by side in one row, like on PC (batch 6).
        <ul className="grid grid-cols-4 gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-flow-col lg:grid-cols-none lg:auto-cols-fr">
          <li className="col-span-full flex items-baseline justify-between gap-0.5 rounded-xl bg-muted/50 p-3 sm:col-span-1 sm:flex-col sm:justify-start">
            <span className="text-xs font-medium text-muted-foreground">
              {t("total")}
            </span>
            <span className="text-3xl font-bold tabular-nums">
              {hours(weeklyAverage.totalSeconds)}
            </span>
          </li>
          {sports.map((sport) => (
            <AverageCard
              key={sport}
              label={tSports(sport)}
              sport={sport}
              average={weeklyAverage}
              units={units}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noFinishedWeek")}</p>
      )}

      {weeklyAverage && (
        <p className="text-xs text-muted-foreground">
          {t("averageNote", { count: finishedWeeks })}
        </p>
      )}

      {/* One compact line: the total hours, then each trained sport's distance · time. */}
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-sm">
        <span className="font-medium">{t("periodTotal")}</span>
        {totals.count > 0 ? (
          <>
            <span className="font-semibold tabular-nums">
              {hours(totals.totalSeconds)}
            </span>
            {trainedSports(totals).map((sport) => (
              <SportLine
                key={sport}
                sport={sport}
                totals={totals}
                units={units}
              />
            ))}
          </>
        ) : (
          <span className="text-muted-foreground">–</span>
        )}
      </p>
    </section>
  );
}

/**
 * This week so far, in its own card between the average box and the calendar (owner feedback
 * 2026-11-12, idea B): its hours against a target as a progress bar in sport colors, a mark where the
 * week should be by today, and whether it's ahead or behind. The target is the weekly goal when the
 * user set one, else the average week of the shown period (owner feedback 2026-11-17); the info button
 * in the corner says which, and where to change it. Below, one line per sport: how much is left, and
 * how it compares with the average week. It folds; the header with the hours stays visible (2026-11-15).
 */
function ThisWeekCard({
  calendar,
  units,
  defaultOpen,
  view,
  weeklyGoal,
  goalsHref,
}: CalendarProps & {
  defaultOpen: boolean;
  view?: CalendarView;
  weeklyGoal: WeeklyGoal | null;
  goalsHref?: GoalsHref;
}) {
  const t = useTranslations("Calendar");
  const hours = useHours();
  const { currentWeek, weeklyAverage } = calendar;
  if (!currentWeek) return null;

  const { week, day } = currentWeek;
  const { total, sports } = weekProgress(
    currentWeek,
    weeklyAverage,
    weeklyGoal,
  );
  const soFar = total.done;
  const scale = Math.max(1, soFar, total.target ?? 0);
  const expected = total.expectedSoFar;
  const ahead = expected !== null && soFar >= expected;
  const Trend = ahead ? TrendingUp : TrendingDown;
  const hasGoal = weeklyGoal !== null;

  return (
    <ThisWeekToggle
      view={view}
      defaultOpen={defaultOpen}
      corner={
        <InfoTip label={t("infoLabel")}>
          <p>{t(hasGoal ? "infoGoal" : "infoAverage")}</p>
          {goalsHref && (
            <Link
              href={goalsHref}
              className="mt-2 inline-block font-medium underline underline-offset-4"
            >
              {t(hasGoal ? "infoChange" : "infoSet")}
            </Link>
          )}
        </InfoTip>
      }
      summary={
        <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-sm font-medium text-muted-foreground">
            {t("thisWeek", { day })}
          </span>
          <span className="text-sm tabular-nums">
            <span className="text-2xl font-bold">{hours(soFar)}</span>
            {total.target !== null && (
              <span className="text-muted-foreground">
                {" "}
                {t(total.source === "goal" ? "ofGoal" : "ofAverage", {
                  target: hours(total.target),
                })}
              </span>
            )}
          </span>
        </span>
      }
    >
      <div className="relative h-3">
        <span className="absolute inset-0 rounded-full bg-muted" />
        {soFar > 0 && (
          <SportBar
            totals={week.totals}
            className="absolute inset-y-0 left-0 h-3"
            widthPercent={(soFar / scale) * 100}
          />
        )}
        {expected !== null && (
          <span
            aria-hidden
            className="absolute -inset-y-1 w-0.5 rounded-full bg-foreground"
            style={{ left: `${Math.min(100, (expected / scale) * 100)}%` }}
          />
        )}
      </div>

      {expected !== null && (
        <p className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
          <span>
            {t(total.source === "goal" ? "goalByDay" : "usualByDay", {
              day,
              time: hours(expected),
            })}
          </span>
          <span className="flex items-center gap-1 font-medium text-foreground">
            <Trend
              className={cn("size-3.5", ahead ? "text-zone-2" : "text-zone-4")}
            />
            {t(ahead ? "ahead" : "behind", {
              diff: hours(Math.abs(soFar - expected)),
            })}
          </span>
        </p>
      )}

      {sports.length > 0 && (
        <ul className="flex flex-col gap-2.5 border-t pt-3 text-sm">
          {sports.map((progress) => (
            <SportProgressLine
              key={progress.sport}
              progress={progress}
              units={units}
            />
          ))}
        </ul>
      )}
    </ThisWeekToggle>
  );
}

/**
 * One sport this week (owner feedback 2026-11-17): "[icon] 12.0 km of 30 km goal", what's left, and
 * whether it's over or under the average week, with a thin bar in the sport's color.
 */
function SportProgressLine({
  progress,
  units,
}: {
  progress: SportProgress;
  units: Units;
}) {
  const t = useTranslations("Calendar.sportProgress");
  const hours = useHours();
  const { sport, unit, done, target, source, average } = progress;
  const amount = (value: number) =>
    unit === "meters" ? formatTotalDistance(value, units) : hours(value);

  const left = target !== null && done < target ? target - done : null;
  const reached = target !== null && done >= target;
  const vsAverage = average === null ? null : done - average;
  // With the average as the target, "left" already says it's under; only "over" adds something.
  const showAverage =
    vsAverage !== null && (source === "goal" || vsAverage >= 0);

  return (
    <li className="flex flex-col gap-1">
      <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 tabular-nums">
        <span className="flex items-center gap-1.5">
          <SportIcon sport={sport} />
          <span className="font-semibold">{amount(done)}</span>
          {target !== null && (
            <span className="text-muted-foreground">
              {t(source === "goal" ? "ofGoal" : "ofAverage", {
                target: amount(target),
              })}
            </span>
          )}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 text-xs">
          {left !== null && (
            <span className="font-medium">
              {t("left", { amount: amount(left) })}
            </span>
          )}
          {reached && source === "goal" && (
            <span className="flex items-center gap-0.5 font-medium text-zone-2">
              <Check className="size-3.5" />
              {t("reached")}
            </span>
          )}
          {showAverage && vsAverage !== null && (
            <span
              className={cn(
                "flex items-center gap-0.5",
                vsAverage >= 0 ? "text-zone-2" : "text-muted-foreground",
              )}
            >
              {vsAverage >= 0 ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {t(vsAverage >= 0 ? "overAverage" : "underAverage", {
                amount: amount(Math.abs(vsAverage)),
              })}
            </span>
          )}
        </span>
      </span>
      {target !== null && (
        <span className="h-1 overflow-hidden rounded-full bg-muted">
          <span
            className={cn("block h-full rounded-full", SPORT_BG[sport])}
            style={{ width: `${Math.min(100, (done / target) * 100)}%` }}
          />
        </span>
      )}
    </li>
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
    <li className="flex min-w-0 flex-col items-center gap-0.5 rounded-xl bg-muted/50 px-1 py-2.5 text-center sm:items-start sm:p-3 sm:text-left">
      <span className="flex max-w-full flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground sm:flex-row sm:gap-1.5 sm:text-xs">
        <SportIcon sport={sport} />
        <span className="max-w-full truncate">{label}</span>
      </span>
      <span
        className={cn(
          "text-lg font-bold whitespace-nowrap tabular-nums sm:text-2xl",
          trained ? SPORT_TEXT[sport] : "text-muted-foreground",
        )}
      >
        {!trained ? "–" : (distance ?? hours(average.seconds[sport]))}
      </span>
      {trained && distance && (
        <span className="text-sm font-semibold whitespace-nowrap tabular-nums sm:text-lg">
          {hours(average.seconds[sport])}
        </span>
      )}
    </li>
  );
}
