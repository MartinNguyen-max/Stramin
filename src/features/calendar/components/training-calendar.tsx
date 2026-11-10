import { useFormatter, useTranslations } from "next-intl";
import { DISTANCE_SPORTS, SPORT_BG } from "@/features/activities/sport-style";
import type {
  Calendar,
  CalendarDay,
  CalendarWeek,
  Density,
  Totals,
} from "@/lib/analytics/calendar";
import { SPORTS, type Sport } from "@/lib/analytics/sports";
import { addDays, toDisplayDate } from "@/lib/dates";
import { formatDuration, formatSportDistance } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import {
  ActivityRow,
  CompactChip,
  DetailedChip,
  MiniBar,
} from "./activity-chip";
import { CalendarLink } from "./calendar-shell";

type CalendarProps = { calendar: Calendar; units: Units };

/** Week number · 7 days · week total. */
const GRID = "grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))_8.5rem]";

const ROW_HEIGHT: Record<Density, string> = {
  detailed: "min-h-28",
  compact: "min-h-16",
  mini: "h-11",
};

/**
 * The training calendar (HOME-2..9). A grid on desktop, a list of weeks on phones.
 * Rendered on the server; only the toolbar and links run in the browser.
 */
export function TrainingCalendar({ calendar, units }: CalendarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="hidden md:block">
        <DesktopGrid calendar={calendar} units={units} />
      </div>
      <div className="md:hidden">
        {calendar.density === "mini" ? (
          <MobileMini calendar={calendar} units={units} />
        ) : (
          <MobileWeeks calendar={calendar} units={units} />
        )}
      </div>
      <PeriodTotals calendar={calendar} units={units} />
    </div>
  );
}

/* ---------------------------------------------------------------- Desktop */

function DesktopGrid({ calendar, units }: CalendarProps) {
  const t = useTranslations("Calendar");
  const format = useFormatter();
  const firstWeek = calendar.weeks[0];
  const maxWeekSeconds = Math.max(
    1,
    ...calendar.weeks.map((week) => week.totals.totalSeconds),
  );

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
            "border-b last:border-b-0",
            ROW_HEIGHT[calendar.density],
            calendar.density !== "detailed" &&
              week.months.length > 0 &&
              "border-t-2 border-t-foreground/15 first-of-type:border-t-0",
          )}
        >
          <WeekGutter week={week} density={calendar.density} />
          {week.days.map((day) => (
            <DayCell
              key={day.date}
              day={day}
              density={calendar.density}
              units={units}
            />
          ))}
          <WeekTotalCell
            totals={week.totals}
            density={calendar.density}
            units={units}
            maxSeconds={maxWeekSeconds}
          />
        </div>
      ))}
    </div>
  );
}

/** Week number, and in the denser views the month that starts this week (opens that month). */
function WeekGutter({
  week,
  density,
}: {
  week: CalendarWeek;
  density: Density;
}) {
  const t = useTranslations("Calendar");
  const format = useFormatter();
  return (
    <div className="flex min-w-0 flex-col gap-0.5 border-r px-2 py-1.5 text-xs">
      <span
        className="font-semibold text-muted-foreground tabular-nums"
        title={t("weekNumber", { number: week.number })}
      >
        {week.number}
      </span>
      {density !== "detailed" &&
        week.months.map((month) => (
          <CalendarLink
            key={month}
            query={{ view: "1m", month }}
            title={t("openMonth")}
            className="truncate font-semibold text-foreground underline-offset-2 hover:underline"
          >
            {format.dateTime(toDisplayDate(`${month}-01`), { month: "short" })}
          </CalendarLink>
        ))}
    </div>
  );
}

function DayCell({
  day,
  density,
  units,
}: {
  day: CalendarDay;
  density: Density;
  units: Units;
}) {
  const format = useFormatter();
  const isFirstOfMonth = day.date.endsWith("-01");

  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col gap-1 border-r p-1",
        !day.inPeriod && "bg-muted/40",
        day.isToday && "z-10 ring-2 ring-foreground ring-inset",
        density === "mini" && "gap-0.5 py-0.5",
      )}
    >
      <span
        className={cn(
          "px-0.5 tabular-nums",
          density === "mini" ? "text-[10px] leading-none" : "text-xs",
          day.inPeriod ? "text-foreground" : "text-muted-foreground",
          day.isToday && "font-bold",
          isFirstOfMonth && "font-semibold",
        )}
      >
        {isFirstOfMonth && density === "detailed"
          ? format.dateTime(toDisplayDate(day.date), {
              day: "numeric",
              month: "short",
            })
          : Number(day.date.slice(8))}
      </span>
      {density === "mini" ? (
        <span className="flex min-h-0 flex-1 items-end gap-0.5 px-0.5">
          {day.activities.map((activity) => (
            <MiniBar key={activity.id} activity={activity} units={units} />
          ))}
        </span>
      ) : (
        day.activities.map((activity) =>
          density === "detailed" ? (
            <DetailedChip key={activity.id} activity={activity} units={units} />
          ) : (
            <CompactChip key={activity.id} activity={activity} units={units} />
          ),
        )
      )}
    </div>
  );
}

/** One line per sport: distance (time for strength and other). */
function sportLines(totals: Totals, units: Units) {
  return SPORTS.filter((sport) => totals.seconds[sport] > 0).map((sport) => ({
    sport,
    value:
      (DISTANCE_SPORTS as readonly Sport[]).includes(sport) &&
      totals.meters[sport] > 0
        ? formatSportDistance(sport, totals.meters[sport], units)
        : formatDuration(totals.seconds[sport]),
  }));
}

function WeekTotalCell({
  totals,
  density,
  units,
  maxSeconds,
}: {
  totals: Totals;
  density: Density;
  units: Units;
  maxSeconds: number;
}) {
  const t = useTranslations("Calendar");
  if (totals.count === 0) {
    return (
      <div className="bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground">
        –
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-0.5 bg-muted/30 px-2 py-1.5 text-xs">
      <span className="font-semibold tabular-nums">
        {formatDuration(totals.totalSeconds)} {t("hoursShort")}
      </span>
      {density === "mini" ? (
        <SportBar
          totals={totals}
          className="h-1.5"
          widthPercent={(totals.totalSeconds / maxSeconds) * 100}
        />
      ) : (
        sportLines(totals, units).map(({ sport, value }) => (
          <span
            key={sport}
            className="flex items-center gap-1.5 text-muted-foreground tabular-nums"
          >
            <span className={cn("size-1.5 rounded-full", SPORT_BG[sport])} />
            {value}
          </span>
        ))
      )}
    </div>
  );
}

/** A horizontal bar split into sport colors by time. */
function SportBar({
  totals,
  className,
  widthPercent = 100,
}: {
  totals: Totals;
  className?: string;
  widthPercent?: number;
}) {
  return (
    <span
      className={cn("flex overflow-hidden rounded-full", className)}
      style={{ width: `${Math.max(8, widthPercent)}%` }}
    >
      {SPORTS.map((sport) =>
        totals.seconds[sport] > 0 ? (
          <span
            key={sport}
            className={SPORT_BG[sport]}
            style={{
              width: `${(totals.seconds[sport] / totals.totalSeconds) * 100}%`,
            }}
          />
        ) : null,
      )}
    </span>
  );
}

/* ----------------------------------------------------------------- Phone */

/** On a phone, weeks that haven't started yet are just noise. */
function withoutFutureWeeks(weeks: CalendarWeek[]): CalendarWeek[] {
  return weeks.filter((week) => !week.days[0].isFuture);
}

function MobileWeeks({ calendar, units }: CalendarProps) {
  const t = useTranslations("Calendar");
  const format = useFormatter();

  return (
    <ol className="flex flex-col gap-3">
      {withoutFutureWeeks(calendar.weeks).map((week) => {
        const end = addDays(week.start, 6);
        const activeDays = week.days.filter((day) => day.activities.length > 0);
        return (
          <li
            key={week.start}
            className="flex flex-col gap-2.5 rounded-2xl border bg-card p-3"
          >
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold">
                {t("weekNumber", { number: week.number })}
                <span className="font-normal text-muted-foreground">
                  {" · "}
                  {format.dateTimeRange(
                    toDisplayDate(week.start),
                    toDisplayDate(end),
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

            <div className="grid grid-cols-7 gap-1 text-center">
              {week.days.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg py-1",
                    !day.inPeriod && "opacity-40",
                    day.isToday && "ring-2 ring-foreground",
                  )}
                >
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {format.dateTime(toDisplayDate(day.date), {
                      weekday: "narrow",
                    })}
                  </span>
                  <span className="text-sm tabular-nums">
                    {Number(day.date.slice(8))}
                  </span>
                  <span className="flex h-1.5 gap-0.5">
                    {day.activities.map((activity) => (
                      <span
                        key={activity.id}
                        className={cn(
                          "size-1.5 rounded-full",
                          SPORT_BG[activity.sport],
                        )}
                      />
                    ))}
                  </span>
                </div>
              ))}
            </div>

            {activeDays.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {activeDays.flatMap((day) =>
                  day.activities.map((activity) => (
                    <li
                      key={activity.id}
                      className={cn(
                        "grid grid-cols-[2.75rem_1fr] items-center gap-2",
                        !day.inPeriod && "opacity-60",
                      )}
                    >
                      <span className="text-xs text-muted-foreground">
                        {format.dateTime(toDisplayDate(day.date), {
                          weekday: "short",
                          day: "numeric",
                        })}
                      </span>
                      <ActivityRow activity={activity} units={units} />
                    </li>
                  )),
                )}
              </ul>
            )}

            {week.totals.count > 0 && (
              <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
                {sportLines(week.totals, units).map(({ sport, value }) => (
                  <span key={sport} className="flex items-center gap-1.5">
                    <span
                      className={cn("size-1.5 rounded-full", SPORT_BG[sport])}
                    />
                    {value}
                  </span>
                ))}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Long periods on a phone: one compact row per week. */
function MobileMini({ calendar, units }: CalendarProps) {
  const t = useTranslations("Calendar");
  const format = useFormatter();
  return (
    <ol className="divide-y overflow-hidden rounded-2xl border bg-card">
      {withoutFutureWeeks(calendar.weeks).map((week) => (
        <li
          key={week.start}
          className="grid grid-cols-[2.75rem_1fr_3.25rem] items-center gap-2 px-2 py-1"
        >
          <span className="truncate text-xs">
            {week.months.length > 0 ? (
              <CalendarLink
                query={{ view: "1m", month: week.months[0] }}
                className="font-semibold underline-offset-2 hover:underline"
              >
                {format.dateTime(toDisplayDate(`${week.months[0]}-01`), {
                  month: "short",
                })}
              </CalendarLink>
            ) : (
              <span
                className="text-muted-foreground tabular-nums"
                title={t("weekNumber", { number: week.number })}
              >
                {week.number}
              </span>
            )}
          </span>
          <span className="grid h-7 grid-cols-7 gap-0.5">
            {week.days.map((day) => (
              <span
                key={day.date}
                className={cn(
                  "flex items-end gap-px rounded-sm bg-muted/50 px-px",
                  !day.inPeriod && "opacity-40",
                  day.isToday && "ring-1 ring-foreground",
                )}
              >
                {day.activities.map((activity) => (
                  <MiniBar
                    key={activity.id}
                    activity={activity}
                    units={units}
                  />
                ))}
              </span>
            ))}
          </span>
          <span className="text-right text-xs tabular-nums">
            {week.totals.count > 0
              ? formatDuration(week.totals.totalSeconds)
              : "–"}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ----------------------------------------------------------- Period total */

function PeriodTotals({ calendar, units }: CalendarProps) {
  const t = useTranslations("Calendar");
  const tSports = useTranslations("Activities");
  const { totals, periodWeeks } = calendar;
  const showAverage = periodWeeks > 5;
  const sports = SPORTS.filter(
    (sport) => sport !== "other" || totals.seconds.other > 0,
  );

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
          {showAverage && (
            <>
              {" · "}
              {t("perWeek", {
                value: `${formatDuration(totals.totalSeconds / periodWeeks)} ${t("hoursShort")}`,
              })}
            </>
          )}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {sports.map((sport) => {
          const isDistance =
            (DISTANCE_SPORTS as readonly Sport[]).includes(sport) &&
            totals.meters[sport] > 0;
          const main = isDistance
            ? formatSportDistance(sport, totals.meters[sport], units)
            : totals.seconds[sport] > 0
              ? formatDuration(totals.seconds[sport])
              : "–";
          const average = isDistance
            ? formatSportDistance(
                sport,
                totals.meters[sport] / periodWeeks,
                units,
              )
            : formatDuration(totals.seconds[sport] / periodWeeks);
          return (
            <li
              key={sport}
              className="flex flex-col gap-0.5 rounded-xl bg-muted/50 p-3"
            >
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("size-2 rounded-full", SPORT_BG[sport])} />
                {tSports(`sports.${sport}`)}
              </span>
              <span className="text-lg font-semibold tabular-nums">{main}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {isDistance &&
                  `${formatDuration(totals.seconds[sport])} ${t("hoursShort")}`}
                {isDistance && showAverage && " · "}
                {showAverage && t("perWeek", { value: average })}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
