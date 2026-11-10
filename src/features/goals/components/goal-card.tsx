import { CircleCheck } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { SPORT_BG } from "@/features/activities/sport-style";
import { effortDistanceLabel } from "@/features/profile/distance-label";
import type { TrainingBase } from "@/features/training/components/training-view";
import { workoutsFor } from "@/features/training/workouts";
import {
  type BestEffort,
  type EffortSport,
  findEffort,
} from "@/lib/analytics/best-efforts";
import {
  formatClock,
  formatPaceDifference,
  formatSportDistance,
  formatSportPace,
} from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import type { Goal, SingleGoal } from "../data";
import { goalFeedback } from "../feedback";
import { DeleteGoalButton } from "./delete-goal-button";
import { GapBar, GoalTips, GoalWorkouts } from "./goal-parts";
import { TriathlonGoalCard } from "./triathlon-goal-card";

export type GoalCardProps = {
  efforts: BestEffort[];
  /** Average weekly distance per sport over the last 8 finished weeks, or null without Strava. */
  weeklyMeters: Record<EffortSport, number> | null;
  units: Units;
  readOnly?: boolean;
  /** Where the workout links go (the demo has its own catalog). */
  trainingBase?: TrainingBase;
};

/** One goal card: single sport or triathlon (GOAL-3..6, owner feedback 2026-11-11). */
export function GoalCard({ goal, ...props }: GoalCardProps & { goal: Goal }) {
  return goal.sport === "triathlon" ? (
    <TriathlonGoalCard goal={goal} {...props} />
  ) : (
    <SingleGoalCard goal={goal} {...props} />
  );
}

/**
 * Target, best and gap, each with its pace (G2), what the gap means per km (G3), tips and matching
 * workouts (feedback-rules.md).
 */
function SingleGoalCard({
  goal,
  efforts,
  weeklyMeters,
  units,
  readOnly = false,
  trainingBase = "/training",
}: GoalCardProps & { goal: SingleGoal }) {
  const t = useTranslations("Goals");
  const tSports = useTranslations("Activities.sports");
  const tDistances = useTranslations("Distances");
  const format = useFormatter();
  const locale = useLocale();
  const names = {
    halfMarathon: tDistances("halfMarathon"),
    marathon: tDistances("marathon"),
  };
  const label = (meters: number) =>
    effortDistanceLabel(goal.sport, meters, locale, names);
  const pace = (meters: number, seconds: number) =>
    formatSportPace(goal.sport, meters, seconds, units) ?? "";

  const best = findEffort(efforts, goal.sport, goal.distance)?.seconds;
  const feedback = goalFeedback(
    goal,
    efforts,
    weeklyMeters ? weeklyMeters[goal.sport] : null,
  );
  const { gap, speed, volume } = feedback;
  const achieved = gap?.level === "achieved";
  const paceGap =
    best === undefined
      ? null
      : formatPaceDifference(
          goal.sport,
          goal.distance,
          best,
          goal.target,
          units,
        );

  const tips: string[] = [];
  if (gap?.level === "big") {
    const step = gap.stepTarget ?? 0;
    tips.push(
      t("gap.big", {
        time: formatClock(step),
        pace: pace(goal.distance, step),
      }),
    );
  } else if (gap?.level === "close" || gap?.level === "season") {
    tips.push(t(`gap.${gap.level}`));
  }
  if (speed && !achieved) {
    const reference = label(speed.distance);
    tips.push(
      t("speed.equivalent", {
        time: formatClock(goal.target),
        distance: label(goal.distance),
        needed: formatClock(speed.needed),
        pace: pace(speed.distance, speed.needed),
        reference,
      }),
    );
    if (speed.best !== undefined && speed.limiter) {
      tips.push(
        t(speed.limiter === "speed" ? "speed.slower" : "speed.supports", {
          reference,
          best: formatClock(speed.best),
          pace: pace(speed.distance, speed.best),
        }),
      );
    }
  }
  if (volume && !achieved) {
    tips.push(
      volume.enough
        ? t("volume.good", {
            value: formatSportDistance(goal.sport, volume.perWeek, units),
          })
        : t("volume.low", {
            value: formatSportDistance(goal.sport, volume.perWeek, units),
            target: formatSportDistance(goal.sport, volume.recommended, units),
          }),
    );
  }

  const workouts = feedback.efforts
    .flatMap((effort) => workoutsFor(goal.sport, effort))
    .slice(0, 3);

  return (
    <article className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn("size-2 rounded-full", SPORT_BG[goal.sport])} />
            {tSports(goal.sport)}
          </span>
          <h3 className="text-lg font-semibold">
            {t("card.goal", {
              distance: label(goal.distance),
              time: formatClock(goal.target),
            })}
          </h3>
          <span className="text-sm font-medium tabular-nums">
            {t("card.goalPace", { pace: pace(goal.distance, goal.target) })}
          </span>
        </div>
        {!readOnly && <DeleteGoalButton id={goal.id} />}
      </header>

      {best !== undefined && gap ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm tabular-nums">
            {t("card.currentBest", {
              time: formatClock(best),
              pace: pace(goal.distance, best),
            })}
            {!achieved && (
              <span className="text-muted-foreground">
                {" · "}
                {t("card.toGo", {
                  time: formatClock(gap.seconds),
                  percent: format.number(gap.share, {
                    style: "percent",
                    maximumFractionDigits: 1,
                  }),
                })}
              </span>
            )}
          </p>
          <GapBar target={goal.target} best={best} achieved={achieved} />
          {paceGap && (
            <p className="text-sm">
              {t("card.paceGap", {
                target: pace(goal.distance, goal.target),
                current: pace(goal.distance, best),
                diff: paceGap,
              })}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("card.noBest")}</p>
      )}

      {achieved && (
        <p className="flex items-center gap-2 text-sm font-medium">
          <CircleCheck className="size-4 text-zone-2" />
          {t("card.achieved")}
        </p>
      )}

      <GoalTips tips={tips} />
      <GoalWorkouts workouts={workouts} trainingBase={trainingBase} />
    </article>
  );
}
