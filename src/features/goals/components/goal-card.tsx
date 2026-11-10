import { CircleCheck, Lightbulb } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { SPORT_BG } from "@/features/activities/sport-style";
import { effortDistanceLabel } from "@/features/profile/distance-label";
import type { TrainingBase } from "@/features/training/components/training-view";
import { workoutsFor } from "@/features/training/workouts";
import { EFFORT_BG } from "@/features/training/zones";
import { Link } from "@/i18n/navigation";
import { type BestEffort, findEffort } from "@/lib/analytics/best-efforts";
import { formatClock, formatSportDistance } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import type { Goal } from "../data";
import { goalFeedback } from "../feedback";
import { DeleteGoalButton } from "./delete-goal-button";

/** One goal: target, gap, tips and matching workouts (GOAL-3..6, feedback-rules.md). */
export function GoalCard({
  goal,
  efforts,
  metersPerWeek,
  units,
  readOnly = false,
  trainingBase = "/training",
}: {
  goal: Goal;
  efforts: BestEffort[];
  metersPerWeek: number | null;
  units: Units;
  readOnly?: boolean;
  /** Where the workout links go (the demo has its own catalog). */
  trainingBase?: TrainingBase;
}) {
  const t = useTranslations("Goals");
  const tSports = useTranslations("Activities.sports");
  const tTraining = useTranslations("Training");
  const tDistances = useTranslations("Distances");
  const format = useFormatter();
  const locale = useLocale();
  const names = {
    halfMarathon: tDistances("halfMarathon"),
    marathon: tDistances("marathon"),
  };
  const label = (meters: number) =>
    effortDistanceLabel(goal.sport, meters, locale, names);

  const best = findEffort(efforts, goal.sport, goal.distance)?.seconds;
  const feedback = goalFeedback(goal, efforts, metersPerWeek);
  const { gap, speed, volume } = feedback;
  const achieved = gap?.level === "achieved";

  const tips: string[] = [];
  if (gap?.level === "big") {
    tips.push(t("gap.big", { time: formatClock(gap.stepTarget ?? 0) }));
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
        reference,
      }),
    );
    if (speed.best !== undefined && speed.limiter) {
      tips.push(
        t(speed.limiter === "speed" ? "speed.slower" : "speed.supports", {
          reference,
          best: formatClock(speed.best),
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
        </div>
        {!readOnly && <DeleteGoalButton id={goal.id} />}
      </header>

      {best !== undefined && gap ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm tabular-nums">
            {t("card.currentBest", { time: formatClock(best) })}
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
          <span className="h-2 overflow-hidden rounded-full bg-muted">
            <span
              className={cn(
                "block h-full rounded-full",
                achieved ? "bg-zone-2" : "bg-linear-to-r from-zone-3 to-zone-5",
              )}
              style={{
                width: `${Math.min(100, (goal.target / best) * 100)}%`,
              }}
            />
          </span>
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

      {tips.length > 0 && (
        <ul className="flex flex-col gap-1.5 text-sm">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-zone-3" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}

      {workouts.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t("workouts")}
          </span>
          <ul className="flex flex-wrap gap-2">
            {workouts.map((workout) => (
              <li key={workout.id}>
                <Link
                  href={{
                    pathname: trainingBase,
                    query: { sport: workout.sport, effort: workout.effort },
                    hash: workout.id,
                  }}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:bg-muted"
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      EFFORT_BG[workout.effort],
                    )}
                  />
                  {tTraining(`workouts.${workout.id}.name`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
