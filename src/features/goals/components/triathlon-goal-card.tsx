import { CircleCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SPORT_BG } from "@/features/activities/sport-style";
import { effortDistanceLabel } from "@/features/profile/distance-label";
import { workoutsFor } from "@/features/training/workouts";
import { useTimeGap } from "@/i18n/use-hours";
import { formatClock, formatSportPace } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TriathlonGoal } from "../data";
import { goalFeedback } from "../feedback";
import { triathlonTips } from "../tips";
import {
  freshTime,
  freshTimeNeeded,
  LEGS,
  type Leg,
  RACE_DAY_FACTOR,
  raceDayTime,
  TRIATHLONS,
} from "../triathlon";
import { DeleteGoalButton } from "./delete-goal-button";
import type { GoalCardProps } from "./goal-card";
import { GoalTips, GoalWorkouts } from "./goal-parts";

type LegStatus = {
  leg: Leg;
  distance: number;
  target: number;
  best?: number;
  /** True when there's no best at the distance and `best` is predicted from the others. */
  predicted: boolean;
  /** The best, made slower for race day (`raceDayTime`). */
  raceDay?: number;
  /** How much faster the target is than the race-day time, as a share (> 0 = still to go). */
  share: number | null;
};

/**
 * A half or full Ironman goal (G1): a row per discipline with its target and pace, and what the best
 * at that distance is worth on race day (owner feedback 2026-11-12: everything happens the same day).
 * One short tip for the discipline with the most to gain, then workouts for it.
 */
export function TriathlonGoalCard({
  goal,
  efforts,
  stats,
  units,
  readOnly = false,
  trainingBase = "/training",
}: GoalCardProps & { goal: TriathlonGoal }) {
  const t = useTranslations("Goals.triathlon");
  const tGoals = useTranslations("Goals");
  const tSports = useTranslations("Activities.sports");
  const tDistances = useTranslations("Distances");
  const locale = useLocale();
  const names = {
    halfMarathon: tDistances("halfMarathon"),
    marathon: tDistances("marathon"),
  };
  const label = (leg: Leg, meters: number) =>
    effortDistanceLabel(leg, meters, locale, names);
  const race = TRIATHLONS[goal.race];
  const factor = RACE_DAY_FACTOR[goal.race];

  const legs: LegStatus[] = LEGS.map((leg) => {
    const distance = race.legs[leg];
    const target = goal.splits[leg];
    const fresh = freshTime(leg, distance, efforts);
    const best = fresh?.seconds;
    const raceDay =
      best === undefined ? undefined : raceDayTime(goal.race, leg, best);
    return {
      leg,
      distance,
      target,
      best,
      predicted: fresh?.predicted ?? false,
      raceDay,
      share: raceDay === undefined ? null : (raceDay - target) / raceDay,
    };
  });
  const focus = legs
    .filter((leg) => leg.share !== null && leg.share > 0)
    .sort((a, b) => (b.share ?? 0) - (a.share ?? 0))[0];

  const workouts = focus
    ? goalFeedback(
        {
          sport: focus.leg,
          distance: focus.distance,
          target: freshTimeNeeded(goal.race, focus.leg, focus.target),
        },
        efforts,
        stats ? stats[focus.leg].metersPerWeek : null,
      )
        .efforts.flatMap((effort) => workoutsFor(focus.leg, effort))
        .slice(0, 3)
    : [];

  return (
    <article className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex gap-0.5">
              {LEGS.map((leg) => (
                <span
                  key={leg}
                  className={cn("size-2 rounded-full", SPORT_BG[leg])}
                />
              ))}
            </span>
            {t("name")}
          </span>
          <h3 className="text-lg font-semibold">
            {tGoals("card.goal", {
              distance: t(goal.race),
              time: formatClock(goal.target),
            })}
          </h3>
          <span className="text-xs text-muted-foreground">
            {LEGS.map((leg) => label(leg, race.legs[leg])).join(" · ")}
          </span>
        </div>
        {!readOnly && <DeleteGoalButton id={goal.id} />}
      </header>

      <ul className="flex flex-col divide-y rounded-xl border">
        {legs.map((leg) => (
          <LegRow
            key={leg.leg}
            status={leg}
            name={tSports(leg.leg)}
            distanceLabel={label(leg.leg, leg.distance)}
            targetPace={
              formatSportPace(leg.leg, leg.distance, leg.target, units) ?? ""
            }
          />
        ))}
        {goal.splits.transitions > 0 && (
          <li className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
            <span className="text-muted-foreground">{t("transitions")}</span>
            <span className="font-semibold tabular-nums">
              {formatClock(goal.splits.transitions)}
            </span>
          </li>
        )}
      </ul>
      <p className="text-xs text-muted-foreground">
        {t("raceDayNote", {
          bike: Math.round((factor.bike - 1) * 100),
          run: Math.round((factor.run - 1) * 100),
        })}
      </p>

      <GoalTips tips={triathlonTips(goal.race, legs, stats)} units={units} />
      <GoalWorkouts workouts={workouts} trainingBase={trainingBase} />
    </article>
  );
}

function LegRow({
  status,
  name,
  distanceLabel,
  targetPace,
}: {
  status: LegStatus;
  name: string;
  distanceLabel: string;
  targetPace: string;
}) {
  const t = useTranslations("Goals.triathlon");
  const gapText = useTimeGap();
  const reached = status.share !== null && status.share <= 0;
  return (
    <li className="flex flex-col gap-0.5 px-3 py-2 text-sm">
      <span className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 font-medium">
          <span className={cn("size-2 rounded-full", SPORT_BG[status.leg])} />
          {name}
          <span className="font-normal text-muted-foreground">
            {distanceLabel}
          </span>
        </span>
        <span className="text-right tabular-nums">
          <span className="font-semibold">{formatClock(status.target)}</span>
          <span className="text-muted-foreground"> · {targetPace}</span>
        </span>
      </span>
      <span className="flex items-baseline justify-between gap-3 pl-4 text-xs text-muted-foreground tabular-nums">
        <span>
          {status.best === undefined || status.raceDay === undefined
            ? t("noBest")
            : t(status.predicted ? "raceDayPredicted" : "raceDay", {
                best: formatClock(status.best),
                raceDay: formatClock(status.raceDay),
              })}
        </span>
        {status.raceDay !== undefined &&
          (reached ? (
            <span className="flex items-center gap-1 text-foreground">
              <CircleCheck className="size-3.5 text-zone-2" />
              {t("reached")}
            </span>
          ) : (
            <span>
              {t("toGo", { time: gapText(status.raceDay - status.target) })}
            </span>
          ))}
      </span>
    </li>
  );
}
