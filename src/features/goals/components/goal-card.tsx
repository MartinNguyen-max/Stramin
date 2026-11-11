import { CircleCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SPORT_BG } from "@/features/activities/sport-style";
import { effortDistanceLabel } from "@/features/profile/distance-label";
import type { TrainingBase } from "@/features/training/components/training-view";
import { workoutsFor } from "@/features/training/workouts";
import { useTimeGap } from "@/i18n/use-hours";
import { type BestEffort, findEffort } from "@/lib/analytics/best-efforts";
import {
  formatClock,
  formatPaceDifference,
  formatSportPace,
} from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import type { Goal, SingleGoal } from "../data";
import { goalFeedback } from "../feedback";
import { goalTips, type TrainingStats } from "../tips";
import { DeleteGoalButton } from "./delete-goal-button";
import { GapBar, GoalTips, GoalWorkouts } from "./goal-parts";
import { TriathlonGoalCard } from "./triathlon-goal-card";

export type GoalCardProps = {
  efforts: BestEffort[];
  /** The last 8 finished weeks per sport (`trainingStats`), or null without Strava. */
  stats: TrainingStats | null;
  /** The bike FTP in watts, when known; bike tips then give watts too. */
  ftp?: number | null;
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
 * Short and simple (owner feedback 2026-11-12): a small table with the best, the goal and what's
 * missing, each with its pace; one abstract line on what to work on; matching workouts.
 */
function SingleGoalCard({
  goal,
  efforts,
  stats,
  ftp = null,
  units,
  readOnly = false,
  trainingBase = "/training",
}: GoalCardProps & { goal: SingleGoal }) {
  const gapText = useTimeGap();
  const t = useTranslations("Goals");
  const tSports = useTranslations("Activities.sports");
  const tDistances = useTranslations("Distances");
  const locale = useLocale();
  const names = {
    halfMarathon: tDistances("halfMarathon"),
    marathon: tDistances("marathon"),
  };
  const pace = (seconds: number) =>
    formatSportPace(goal.sport, goal.distance, seconds, units) ?? "";

  const best = findEffort(efforts, goal.sport, goal.distance)?.seconds;
  const feedback = goalFeedback(
    goal,
    efforts,
    stats ? stats[goal.sport].metersPerWeek : null,
  );
  const { gap } = feedback;
  const achieved = gap?.level === "achieved";
  const faster =
    best === undefined
      ? null
      : formatPaceDifference(
          goal.sport,
          goal.distance,
          best,
          goal.target,
          units,
        );

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
              distance: effortDistanceLabel(
                goal.sport,
                goal.distance,
                locale,
                names,
              ),
              time: formatClock(goal.target),
            })}
          </h3>
        </div>
        {!readOnly && <DeleteGoalButton id={goal.id} />}
      </header>

      <dl className="grid grid-cols-[auto_auto_1fr] items-baseline gap-x-4 gap-y-1 text-sm tabular-nums">
        {best !== undefined && (
          <>
            <dt className="text-muted-foreground">{t("card.rowBest")}</dt>
            <dd className="font-semibold">{formatClock(best)}</dd>
            <dd className="text-muted-foreground">{pace(best)}</dd>
          </>
        )}
        <dt className="text-muted-foreground">{t("card.rowGoal")}</dt>
        <dd className="font-semibold">{formatClock(goal.target)}</dd>
        <dd className="text-muted-foreground">{pace(goal.target)}</dd>
        {best !== undefined && gap && !achieved && (
          <>
            <dt className="text-muted-foreground">{t("card.rowGap")}</dt>
            <dd className="font-semibold">{gapText(gap.seconds)}</dd>
            <dd className="text-muted-foreground">
              {faster && t("card.faster", { diff: faster })}
            </dd>
          </>
        )}
      </dl>

      {best !== undefined ? (
        <GapBar target={goal.target} best={best} achieved={achieved} />
      ) : (
        <p className="text-sm text-muted-foreground">{t("card.noBest")}</p>
      )}

      {achieved && (
        <p className="flex items-center gap-2 text-sm font-medium">
          <CircleCheck className="size-4 text-zone-2" />
          {t("card.achieved")}
        </p>
      )}

      <GoalTips tips={goalTips(goal, efforts, stats, ftp)} units={units} />
      <GoalWorkouts workouts={workouts} trainingBase={trainingBase} />
    </article>
  );
}
