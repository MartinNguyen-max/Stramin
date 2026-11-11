"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { SPORT_BG } from "@/features/activities/sport-style";
import { SportIcon } from "@/features/calendar/components/sport-lines";
import { useHours, useTimeGap } from "@/i18n/use-hours";
import { EFFORT_SPORTS } from "@/lib/analytics/best-efforts";
import { toDisplayDate } from "@/lib/dates";
import { formatClock, formatRoundDistance } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { effortDistanceLabel } from "../distance-label";
import type { ProgressPeriod } from "../progress";

/** Greener when better, red when worse. */
const BETTER = "text-green-600 dark:text-green-400";
const WORSE = "text-red-600 dark:text-red-400";

/**
 * "You now vs. you X months ago" (owner feedback 2026-11-12): weekly training and best efforts back
 * then and now, per sport. Pick 3, 6 or 12 months.
 */
export function ProgressCard({
  periods,
  units,
}: {
  periods: ProgressPeriod[];
  units: Units;
}) {
  const t = useTranslations("Profile.progress");
  const format = useFormatter();
  const [months, setMonths] = useState(periods[1]?.months ?? 6);
  const period = periods.find((p) => p.months === months) ?? periods[0];
  if (!period) return null;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("intro", {
              date: format.dateTime(toDisplayDate(period.since), {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            })}
          </p>
        </div>
        <div className="flex gap-1 rounded-full border p-1 text-sm">
          {periods.map((option) => (
            <button
              key={option.months}
              type="button"
              aria-pressed={option.months === months}
              onClick={() => setMonths(option.months)}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-colors",
                option.months === months
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`months.${option.months}`)}
            </button>
          ))}
        </div>
      </div>

      <Legend since={period.since} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Training period={period} units={units} />
        <Efforts period={period} />
      </div>
      <p className="text-xs text-muted-foreground">{t("note")}</p>
    </section>
  );
}

/** "▒ Then (11 May) █ Now": the two bar colors. */
function Legend({ since }: { since: string }) {
  const t = useTranslations("Profile.progress");
  const format = useFormatter();
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-5 rounded-full bg-muted-foreground/30" />
        {t("legendBefore", {
          date: format.dateTime(toDisplayDate(since), {
            day: "numeric",
            month: "short",
          }),
        })}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-5 rounded-full bg-foreground" />
        {t("legendNow")}
      </span>
    </p>
  );
}

/**
 * Per week, back then and now, as two bars per row (owner feedback 2026-11-12: "make it more
 * visual"): total hours, then each sport's distance. The change in % on the right, green when more.
 */
function Training({ period, units }: { period: ProgressPeriod; units: Units }) {
  const t = useTranslations("Profile.progress");
  const tSports = useTranslations("Activities.sports");
  const hours = useHours();
  const rows = [
    {
      key: "total",
      label: t("total"),
      icon: null,
      color: "bg-foreground",
      before: period.hours.before,
      now: period.hours.now,
      text: (value: number) => hours(value),
    },
    ...EFFORT_SPORTS.filter(
      (sport) =>
        period.volume[sport].before.meters > 0 ||
        period.volume[sport].now.meters > 0,
    ).map((sport) => ({
      key: sport,
      label: tSports(sport),
      icon: <SportIcon sport={sport} />,
      color: SPORT_BG[sport],
      before: period.volume[sport].before.meters,
      now: period.volume[sport].now.meters,
      text: (value: number) => formatRoundDistance(value, units),
    })),
  ];
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{t("trainingTitle")}</h3>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => {
          const scale = Math.max(row.before, row.now, 1);
          return (
            <li
              key={row.key}
              className="grid grid-cols-[5.5rem_minmax(0,1fr)_3.5rem] items-center gap-x-3"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {row.icon}
                {row.label}
              </span>
              <span className="flex flex-col gap-1">
                <Bar
                  share={row.before / scale}
                  className="bg-muted-foreground/30"
                  value={row.text(row.before)}
                  muted
                />
                <Bar
                  share={row.now / scale}
                  className={row.color}
                  value={row.text(row.now)}
                />
              </span>
              <Change before={row.before} now={row.now} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** One horizontal bar with its value after it. */
function Bar({
  share,
  className,
  value,
  muted = false,
}: {
  share: number;
  className: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-2.5 min-w-0 flex-1">
        <span
          className={cn("block h-full rounded-full", className)}
          style={{ width: `${Math.max(2, share * 100)}%` }}
        />
      </span>
      <span
        className={cn(
          "w-16 shrink-0 text-xs tabular-nums",
          muted ? "text-muted-foreground" : "font-semibold",
        )}
      >
        {value}
      </span>
    </span>
  );
}

/** "▲ 27 %" in green, "▼ 12 %" in red, "–" when about the same. */
function Change({ before, now }: { before: number; now: number }) {
  const t = useTranslations("Profile.progress");
  if (before <= 0) {
    return now > 0 ? (
      <span className={cn("text-right text-xs font-semibold", BETTER)}>
        {t("new")}
      </span>
    ) : (
      <span />
    );
  }
  const percent = Math.round(((now - before) / before) * 100);
  if (Math.abs(percent) < 1) {
    return <span className="text-right text-xs text-muted-foreground">–</span>;
  }
  return (
    <span
      className={cn(
        "text-right text-xs font-semibold tabular-nums",
        percent > 0 ? BETTER : WORSE,
      )}
    >
      {percent > 0 ? "▲" : "▼"} {Math.abs(percent)} %
    </span>
  );
}

/** Best efforts that changed: "1:51:20 → 1:50:53" with the gain in green (or loss in red). */
function Efforts({ period }: { period: ProgressPeriod }) {
  const t = useTranslations("Profile.progress");
  const tDistances = useTranslations("Distances");
  const locale = useLocale();
  const gap = useTimeGap();
  const names = {
    halfMarathon: tDistances("halfMarathon"),
    marathon: tDistances("marathon"),
  };
  const changed = period.efforts.filter(
    (effort) =>
      effort.before === undefined ||
      Math.round(effort.now - effort.before) !== 0,
  );
  const unchanged = period.efforts.length - changed.length;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{t("effortsTitle")}</h3>
      {changed.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t(period.efforts.length === 0 ? "noEfforts" : "noChange")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {changed.map((effort) => {
            const diff =
              effort.before === undefined ? null : effort.now - effort.before;
            return (
              <li
                key={`${effort.sport}-${effort.distance}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-muted/40 px-3 py-2 text-sm"
              >
                <span className="flex min-w-24 items-center gap-1.5 font-medium">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      SPORT_BG[effort.sport],
                    )}
                  />
                  {effortDistanceLabel(
                    effort.sport,
                    effort.distance,
                    locale,
                    names,
                  )}
                </span>
                <span className="flex items-center gap-1.5 tabular-nums">
                  {effort.before !== undefined && (
                    <>
                      <span className="text-muted-foreground">
                        {formatClock(effort.before)}
                      </span>
                      <span className="text-muted-foreground">→</span>
                    </>
                  )}
                  <span className="font-semibold">
                    {formatClock(effort.now)}
                  </span>
                </span>
                <span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                    diff === null
                      ? "bg-muted text-muted-foreground"
                      : diff < 0
                        ? "bg-green-500/15 text-green-700 dark:text-green-400"
                        : "bg-red-500/15 text-red-700 dark:text-red-400",
                  )}
                >
                  {diff === null
                    ? t("new")
                    : t(diff < 0 ? "faster" : "slower", {
                        diff: gap(diff),
                      })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {unchanged > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("unchanged", { count: unchanged })}
        </p>
      )}
    </div>
  );
}
