import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  AVERAGE_PERIODS,
  type AveragePeriod,
  type AverageWeek as AverageWeekData,
} from "@/lib/analytics/weekly";
import { formatDistance, formatDuration } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { DISTANCE_SPORTS, SPORT_BG } from "../sport-style";

/**
 * Average week per sport over a chosen period (HOME-3).
 * Distance for swim/bike/run, time for strength. The period is a link (?period=…), so it works without JavaScript.
 */
export function AverageWeek({
  average,
  period,
  units,
}: {
  average: AverageWeekData;
  period: AveragePeriod;
  units: Units;
}) {
  const t = useTranslations("Activities");

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">{t("averageWeek")}</h2>
        <nav
          className="flex rounded-full border p-0.5 text-xs"
          aria-label={t("period")}
        >
          {AVERAGE_PERIODS.map((option) => (
            <Link
              key={option}
              href={{ pathname: "/home", query: { period: option } }}
              aria-current={option === period ? "true" : undefined}
              scroll={false}
              className={cn(
                "rounded-full px-2.5 py-1 transition-colors",
                option === period
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`periods.${option}`)}
            </Link>
          ))}
        </nav>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DISTANCE_SPORTS.map((sport) => (
          <li
            key={sport}
            className="flex flex-col gap-1 rounded-xl bg-muted/50 p-3"
          >
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("size-2 rounded-full", SPORT_BG[sport])} />
              {t(`sports.${sport}`)}
            </span>
            <span className="text-lg font-semibold tabular-nums">
              {formatDistance(average.meters[sport], units, {
                precise: sport === "swim",
              })}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatDuration(average.seconds[sport])} {t("hours")}
            </span>
          </li>
        ))}
        <li className="flex flex-col gap-1 rounded-xl bg-muted/50 p-3">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn("size-2 rounded-full", SPORT_BG.strength)} />
            {t("sports.strength")}
          </span>
          <span className="text-lg font-semibold tabular-nums">
            {formatDuration(average.seconds.strength)}
          </span>
          <span className="text-xs text-muted-foreground">{t("hours")}</span>
        </li>
      </ul>
      <p className="text-xs text-muted-foreground">
        {t("averageNote", { weeks: average.weeks })}
      </p>
    </section>
  );
}
