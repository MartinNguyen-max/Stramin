"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { SPORT_BG } from "@/features/activities/sport-style";
import type { CalendarDay, CalendarWeek } from "@/lib/analytics/calendar";
import { toDisplayDate } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { ActivityRow } from "./activity-chip";
import { SportBar, SportLineText, sportLines } from "./sport-lines";

/** The day that's selected at first: today, else the last day with training, else the first day. */
function initialDay(weeks: CalendarWeek[]): string {
  const days = weeks.flatMap((week) => week.days);
  const today = days.find((day) => day.isToday && day.inPeriod);
  if (today) return today.date;
  const trained = days.filter(
    (day) => day.inPeriod && day.activities.length > 0,
  );
  return (trained.at(-1) ?? days.find((day) => day.inPeriod) ?? days[0]).date;
}

/**
 * The calendar on phones (owner feedback H10): a real month grid like the desktop calendar.
 * Each day shows sport dots and its training time; tapping a day lists its workouts below,
 * together with that week's totals. The last column is the week's total time.
 */
export function MobileCalendar({
  weeks,
  units,
  multiMonth,
}: {
  weeks: CalendarWeek[];
  units: Units;
  multiMonth: boolean;
}) {
  const t = useTranslations("Calendar");
  const format = useFormatter();
  const [selected, setSelected] = useState(() => initialDay(weeks));

  const selectedWeek =
    weeks.find((week) => week.days.some((day) => day.date === selected)) ??
    weeks[0];
  const selectedDay =
    selectedWeek.days.find((day) => day.date === selected) ??
    selectedWeek.days[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_2.75rem] border-b bg-muted/50 py-1.5 text-center text-[11px] font-medium text-muted-foreground">
          {weeks[0].days.map((day) => (
            <span key={day.date}>
              {format.dateTime(toDisplayDate(day.date), { weekday: "narrow" })}
            </span>
          ))}
          <span aria-hidden>Σ</span>
        </div>
        {weeks.map((week) => (
          <div key={week.start}>
            {multiMonth &&
              week.months.map((month) => (
                <div
                  key={month}
                  className="border-b bg-muted/30 px-2 py-1 text-xs font-semibold first-letter:uppercase"
                >
                  {format.dateTime(toDisplayDate(`${month}-01`), {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              ))}
            <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_2.75rem] border-b last:border-b-0">
              {week.days.map((day) => (
                <DayButton
                  key={day.date}
                  day={day}
                  selected={day.date === selected}
                  onSelect={() => setSelected(day.date)}
                />
              ))}
              <span className="flex flex-col items-center justify-center bg-muted/40 text-[11px] font-semibold tabular-nums">
                {week.totals.count > 0
                  ? formatDuration(week.totals.totalSeconds)
                  : "–"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <section
        aria-live="polite"
        className="flex flex-col gap-2.5 rounded-2xl border bg-card p-3"
      >
        <h3 className="text-sm font-semibold first-letter:uppercase">
          {format.dateTime(toDisplayDate(selectedDay.date), {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h3>
        {selectedDay.activities.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {selectedDay.activities.map((activity) => (
              <li key={activity.id}>
                <ActivityRow activity={activity} units={units} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t("restDay")}</p>
        )}

        <div className="flex flex-col gap-1.5 border-t pt-2.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-semibold">
              {t("weekNumber", { number: selectedWeek.number })}
            </span>
            <span className="font-semibold tabular-nums">
              {selectedWeek.totals.count > 0
                ? `${formatDuration(selectedWeek.totals.totalSeconds)} ${t("hoursShort")}`
                : "–"}
            </span>
          </div>
          {selectedWeek.totals.count > 0 && (
            <>
              <SportBar totals={selectedWeek.totals} className="h-1.5" />
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                {sportLines(selectedWeek.totals, units).map((line) => (
                  <SportLineText key={line.sport} line={line} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function DayButton({
  day,
  selected,
  onSelect,
}: {
  day: CalendarDay;
  selected: boolean;
  onSelect: () => void;
}) {
  const format = useFormatter();
  const seconds = day.activities.reduce(
    (sum, activity) => sum + activity.movingSeconds,
    0,
  );
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={format.dateTime(toDisplayDate(day.date), {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}
      className={cn(
        "flex h-16 min-w-0 flex-col items-center gap-0.5 border-r pt-1 transition-colors",
        !day.inPeriod && "bg-muted/40 text-muted-foreground",
        selected && "bg-foreground text-background",
      )}
    >
      <span
        className={cn(
          "grid size-6 place-items-center rounded-full text-sm tabular-nums",
          day.isToday && !selected && "ring-2 ring-foreground",
          day.isToday && "font-bold",
        )}
      >
        {Number(day.date.slice(8))}
      </span>
      <span className="flex h-1.5 gap-0.5">
        {day.activities.slice(0, 3).map((activity) => (
          <span
            key={activity.id}
            className={cn("size-1.5 rounded-full", SPORT_BG[activity.sport])}
          />
        ))}
      </span>
      {seconds > 0 && (
        <span
          className={cn(
            "text-[10px] tabular-nums",
            selected ? "text-background/80" : "text-muted-foreground",
          )}
        >
          {formatDuration(seconds)}
        </span>
      )}
    </button>
  );
}
