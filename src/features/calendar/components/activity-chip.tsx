import { useTranslations } from "next-intl";
import {
  SPORT_BG,
  SPORT_BORDER,
  SPORT_ICON,
  SPORT_TEXT,
  SPORT_TINT,
} from "@/features/activities/sport-style";
import { stravaActivityUrl } from "@/features/activities/strava-url";
import { DEMO_ID_PREFIX } from "@/features/demo/demo-activities";
import type { CalendarActivity } from "@/lib/analytics/calendar";
import {
  formatClock,
  formatSportDistance,
  formatSportPace,
} from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";

/** The numbers shown for a workout: distance, pace/speed and time (HOME-3). */
export function activityStats(activity: CalendarActivity, units: Units) {
  const distance =
    activity.distanceMeters > 0
      ? formatSportDistance(activity.sport, activity.distanceMeters, units)
      : null;
  const pace = formatSportPace(
    activity.sport,
    activity.distanceMeters,
    activity.movingSeconds,
    units,
  );
  return { distance, pace, time: formatClock(activity.movingSeconds) };
}

function useDescription(activity: CalendarActivity, units: Units) {
  const t = useTranslations("Activities");
  const { distance, pace, time } = activityStats(activity, units);
  return [activity.name, t(`sports.${activity.sport}`), distance, pace, time]
    .filter(Boolean)
    .join(" · ");
}

type ChipProps = {
  activity: CalendarActivity;
  units: Units;
  className?: string;
};

/** Opens the workout on Strava in a new tab (ACT-4). */
function StravaLink({
  activity,
  units,
  className,
  style,
  children,
}: ChipProps & { style?: React.CSSProperties; children: React.ReactNode }) {
  const t = useTranslations("Calendar");
  const description = useDescription(activity, units);
  // Demo workouts (/demo) don't exist on Strava.
  if (activity.id.startsWith(DEMO_ID_PREFIX)) {
    return (
      <span title={description} className={className} style={style}>
        {children}
      </span>
    );
  }
  return (
    <a
      href={stravaActivityUrl(activity.id)}
      target="_blank"
      rel="noopener noreferrer"
      title={`${description}\n${t("viewOnStrava")}`}
      aria-label={`${description}. ${t("viewOnStrava")}`}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}

/** 1-month view: title, then distance · pace · time, small (HOME-3). */
export function DetailedChip({ activity, units, className }: ChipProps) {
  const Icon = SPORT_ICON[activity.sport];
  const { distance, pace, time } = activityStats(activity, units);
  return (
    <StravaLink
      activity={activity}
      units={units}
      className={cn(
        "block rounded-md border-l-[3px] px-1.5 py-1 text-[11px] leading-tight transition-colors hover:brightness-95 dark:hover:brightness-125",
        SPORT_BORDER[activity.sport],
        SPORT_TINT[activity.sport],
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-1 font-medium">
        <Icon
          aria-hidden
          className={cn("size-3 shrink-0", SPORT_TEXT[activity.sport])}
        />
        <span className="truncate">{activity.name}</span>
      </span>
      <span className="mt-0.5 flex flex-wrap gap-x-1.5 text-muted-foreground tabular-nums">
        {distance && <span>{distance}</span>}
        {pace && <span>{pace}</span>}
        <span>{time}</span>
      </span>
    </StravaLink>
  );
}

/** Phone list row: icon, title and the numbers on one line. */
export function ActivityRow({ activity, units, className }: ChipProps) {
  const Icon = SPORT_ICON[activity.sport];
  const { distance, pace, time } = activityStats(activity, units);
  return (
    <StravaLink
      activity={activity}
      units={units}
      className={cn(
        "flex min-w-0 items-start gap-2 rounded-lg border-l-[3px] px-2 py-1.5 text-xs",
        SPORT_BORDER[activity.sport],
        SPORT_TINT[activity.sport],
        className,
      )}
    >
      <Icon
        aria-hidden
        className={cn("mt-0.5 size-3.5 shrink-0", SPORT_TEXT[activity.sport])}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium">{activity.name}</span>
        <span className="text-muted-foreground tabular-nums">
          {[distance, pace, time].filter(Boolean).join(" · ")}
        </span>
      </span>
    </StravaLink>
  );
}
