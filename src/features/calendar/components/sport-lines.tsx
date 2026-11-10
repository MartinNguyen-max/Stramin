import { DISTANCE_SPORTS, SPORT_BG } from "@/features/activities/sport-style";
import type { Totals } from "@/lib/analytics/calendar";
import { SPORTS, type Sport } from "@/lib/analytics/sports";
import { formatDuration, formatSportDistance } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";

/** Shared by the server-rendered calendar and the phone calendar (no hooks, no server imports). */

export type SportLine = {
  sport: Sport;
  time: string;
  distance: string | null;
};

/** Per sport with training: its time, plus the distance for swim/bike/run (owner feedback H4). */
export function sportLines(totals: Totals, units: Units): SportLine[] {
  return SPORTS.filter((sport) => totals.seconds[sport] > 0).map((sport) => ({
    sport,
    time: formatDuration(totals.seconds[sport]),
    distance:
      (DISTANCE_SPORTS as readonly Sport[]).includes(sport) &&
      totals.meters[sport] > 0
        ? formatSportDistance(sport, totals.meters[sport], units)
        : null,
  }));
}

/** "● 2:00 · 8.0 km" */
export function SportLineText({ line }: { line: SportLine }) {
  return (
    <span className="flex items-center gap-1.5 tabular-nums">
      <span
        className={cn("size-1.5 shrink-0 rounded-full", SPORT_BG[line.sport])}
      />
      <span className="text-foreground">{line.time}</span>
      {line.distance && (
        <span className="text-muted-foreground">· {line.distance}</span>
      )}
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
