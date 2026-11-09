import { useFormatter, useTranslations } from "next-intl";
import { SPORTS } from "@/lib/analytics/sports";
import type { WeekTotals } from "@/lib/analytics/weekly";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SPORT_BG } from "../sport-style";

/** "This week": total hours plus the split by sport (HOME-1). */
export function ThisWeek({ week }: { week: WeekTotals }) {
  const t = useTranslations("Activities");
  const sports = SPORTS.filter((sport) => week.seconds[sport] > 0);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-semibold">{t("thisWeek")}</h2>
        <p className="text-2xl font-bold tabular-nums">
          {formatDuration(week.totalSeconds)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {t("hours")}
          </span>
        </p>
      </div>
      <SportBar week={week} className="h-3" />
      {sports.length > 0 ? (
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {sports.map((sport) => (
            <li key={sport} className="flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", SPORT_BG[sport])} />
              <span className="text-muted-foreground">
                {t(`sports.${sport}`)}
              </span>
              <span className="tabular-nums">
                {formatDuration(week.seconds[sport])}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noTrainingYet")}</p>
      )}
    </section>
  );
}

/** Week-by-week comparison, newest first (HOME-2). Rest weeks show as empty rows. */
export function WeeksChart({ weeks }: { weeks: WeekTotals[] }) {
  const t = useTranslations("Activities");
  const format = useFormatter();
  const maxSeconds = Math.max(1, ...weeks.map((week) => week.totalSeconds));

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <h2 className="font-semibold">{t("weeks")}</h2>
      <ul className="flex flex-col gap-2 text-sm">
        {weeks.map((week) => (
          <li
            key={week.weekStart}
            className="grid grid-cols-[4.5rem_3rem_1fr] items-center gap-3"
          >
            <span className="text-muted-foreground tabular-nums">
              {format.dateTime(new Date(`${week.weekStart}T12:00:00Z`), {
                day: "numeric",
                month: "short",
              })}
            </span>
            <span className="text-right tabular-nums">
              {formatDuration(week.totalSeconds)}
            </span>
            <span className="h-2.5 rounded-full bg-muted">
              <SportBar
                week={week}
                className="h-full"
                style={{ width: `${(week.totalSeconds / maxSeconds) * 100}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A horizontal bar split into sport colors. */
function SportBar({
  week,
  className,
  style,
}: {
  week: WeekTotals;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (week.totalSeconds === 0) {
    return <span className={cn("block rounded-full bg-muted", className)} />;
  }
  return (
    <span
      className={cn("flex overflow-hidden rounded-full", className)}
      style={style}
    >
      {SPORTS.map((sport) =>
        week.seconds[sport] > 0 ? (
          <span
            key={sport}
            className={SPORT_BG[sport]}
            style={{
              width: `${(week.seconds[sport] / week.totalSeconds) * 100}%`,
            }}
          />
        ) : null,
      )}
    </span>
  );
}
