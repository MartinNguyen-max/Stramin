import { useTranslations } from "next-intl";
import {
  DISTANCE_SPORTS,
  SPORT_BG,
  SPORT_ICON,
  SPORT_TEXT,
} from "@/features/activities/sport-style";
import { useHours } from "@/i18n/use-hours";
import type { Totals } from "@/lib/analytics/calendar";
import { SPORTS, type Sport } from "@/lib/analytics/sports";
import { formatTotalDistance } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";

/**
 * Sport numbers for the totals (week, month, period). Shared by the server-rendered calendar and the
 * phone calendar, so only hooks that work in both. Totals always show km, also for swims (feedback
 * 2026-11-11, C1); the calendar days keep meters.
 */

/** The sports with training in these totals. */
export function trainedSports(totals: Totals): Sport[] {
  return SPORTS.filter((sport) => totals.seconds[sport] > 0);
}

/** The distance in totals, or null for strength/other (shown as time). */
export function totalDistance(
  sport: Sport,
  totals: Totals,
  units: Units,
): string | null {
  return (DISTANCE_SPORTS as readonly Sport[]).includes(sport) &&
    totals.meters[sport] > 0
    ? formatTotalDistance(totals.meters[sport], units)
    : null;
}

/** The sport's icon in its color, with the sport name for screen readers and on hover. */
export function SportIcon({
  sport,
  className,
}: {
  sport: Sport;
  className?: string;
}) {
  const tSports = useTranslations("Activities.sports");
  const Icon = SPORT_ICON[sport];
  return (
    <Icon
      role="img"
      aria-label={tSports(sport)}
      className={cn("size-3.5 shrink-0", SPORT_TEXT[sport], className)}
    >
      <title>{tSports(sport)}</title>
    </Icon>
  );
}

/** "[icon] 2:00 h · 8.0 km": hours first, the distance beside (week totals, C1). */
export function SportTimeLine({
  sport,
  totals,
  units,
}: {
  sport: Sport;
  totals: Totals;
  units: Units;
}) {
  const hours = useHours();
  const distance = totalDistance(sport, totals, units);
  return (
    <span className="flex items-center gap-1.5 tabular-nums">
      <SportIcon sport={sport} />
      <span className="text-foreground">{hours(totals.seconds[sport])}</span>
      {distance && (
        <span className="truncate text-muted-foreground">· {distance}</span>
      )}
    </span>
  );
}

/** "[icon] 8.0 km", or the time for strength: the short form for strips and the week overview. */
export function SportDistance({
  sport,
  totals,
  units,
  className,
}: {
  sport: Sport;
  totals: Totals;
  units: Units;
  className?: string;
}) {
  const hours = useHours();
  return (
    <span
      className={cn("inline-flex items-center gap-1 tabular-nums", className)}
    >
      <SportIcon sport={sport} className="size-3" />
      {totalDistance(sport, totals, units) ?? hours(totals.seconds[sport])}
    </span>
  );
}

/** A horizontal bar split into sport colors by time. */
export function SportBar({
  totals,
  className,
  widthPercent = 100,
}: {
  totals: Totals;
  className?: string;
  widthPercent?: number;
}) {
  if (totals.totalSeconds === 0) {
    return <span className={cn("block rounded-full bg-muted", className)} />;
  }
  return (
    <span
      className={cn("flex overflow-hidden rounded-full", className)}
      style={{ width: `${Math.max(4, widthPercent)}%` }}
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
