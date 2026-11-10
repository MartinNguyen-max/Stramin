import { CircleCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SPORT_BG } from "@/features/activities/sport-style";
import { effortDistanceLabel } from "@/features/profile/distance-label";
import { workoutsFor } from "@/features/training/workouts";
import { findEffort } from "@/lib/analytics/best-efforts";
import {
  formatClock,
  formatPaceDifference,
  formatSportDistance,
  formatSportPace,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TriathlonGoal } from "../data";
import { goalFeedback, volumeCheck } from "../feedback";
import { LEGS, type Leg, runOffTheBike, TRIATHLONS } from "../triathlon";
import { DeleteGoalButton } from "./delete-goal-button";
import type { GoalCardProps } from "./goal-card";
import { GoalTips, GoalWorkouts } from "./goal-parts";

type LegStatus = {
  leg: Leg;
  distance: number;
  target: number;
  best?: number;
  /** How much faster the target is than the best, as a share of the best (> 0 = still to go). */
  share: number | null;
};

/**
 * A half or full distance triathlon goal (owner feedback 2026-11-11, G1): a row per discipline with
 * its target and pace next to the best effort at that distance, then tips for the discipline with the
 * biggest gap and for running off the bike.
 */
export function TriathlonGoalCard({
  goal,
  efforts,
  weeklyMeters,
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
  const pace = (leg: Leg, meters: number, seconds: number) =>
    formatSportPace(leg, meters, seconds, units) ?? "";
  const race = TRIATHLONS[goal.race];

  const legs: LegStatus[] = LEGS.map((leg) => {
    const distance = race.legs[leg];
    const target = goal.splits[leg];
    const best = findEffort(efforts, leg, distance)?.seconds;
    return {
      leg,
      distance,
      target,
      best,
      share: best === undefined ? null : (best - target) / best,
    };
  });
  const withBest = legs.filter((leg) => leg.best !== undefined);
  const focus = legs
    .filter((leg) => leg.share !== null && leg.share > 0)
    .sort((a, b) => (b.share ?? 0) - (a.share ?? 0))[0];

  const tips: string[] = [];
  if (withBest.length === 0) {
    tips.push(t("noBests"));
  } else if (focus?.best !== undefined) {
    tips.push(
      t("biggestGap", {
        sport: tSports(focus.leg),
        target: pace(focus.leg, focus.distance, focus.target),
        current: pace(focus.leg, focus.distance, focus.best),
        diff:
          formatPaceDifference(
            focus.leg,
            focus.distance,
            focus.best,
            focus.target,
            units,
          ) ?? "",
      }),
    );
  } else {
    tips.push(t("allReached"));
  }

  const run = legs.find((leg) => leg.leg === "run");
  if (run?.best !== undefined) {
    const [from, to] = runOffTheBike(run.best);
    tips.push(
      t("runOffBike", {
        best: formatClock(run.best),
        from: formatClock(from),
        to: formatClock(to),
      }),
    );
    tips.push(
      t(run.target < from ? "runFaster" : "runFits", {
        time: formatClock(run.target),
      }),
    );
  }

  const focusMeters = focus && weeklyMeters ? weeklyMeters[focus.leg] : null;
  const volume = focus
    ? volumeCheck(focus.leg, focus.distance, focusMeters)
    : null;
  if (focus && volume) {
    tips.push(
      volume.enough
        ? tGoals("volume.good", {
            value: formatSportDistance(focus.leg, volume.perWeek, units),
          })
        : tGoals("volume.low", {
            value: formatSportDistance(focus.leg, volume.perWeek, units),
            target: formatSportDistance(focus.leg, volume.recommended, units),
          }),
    );
  }

  const workouts = focus
    ? goalFeedback(
        { sport: focus.leg, distance: focus.distance, target: focus.target },
        efforts,
        focusMeters,
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
            targetPace={pace(leg.leg, leg.distance, leg.target)}
            bestPace={
              leg.best === undefined
                ? null
                : pace(leg.leg, leg.distance, leg.best)
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

      <GoalTips tips={tips} />
      <GoalWorkouts workouts={workouts} trainingBase={trainingBase} />
    </article>
  );
}

function LegRow({
  status,
  name,
  distanceLabel,
  targetPace,
  bestPace,
}: {
  status: LegStatus;
  name: string;
  distanceLabel: string;
  targetPace: string;
  bestPace: string | null;
}) {
  const t = useTranslations("Goals.triathlon");
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
          {status.best === undefined
            ? t("noBest")
            : t("best", {
                time: formatClock(status.best),
                pace: bestPace ?? "",
              })}
        </span>
        {status.best !== undefined &&
          (reached ? (
            <span className="flex items-center gap-1 text-foreground">
              <CircleCheck className="size-3.5 text-zone-2" />
              {t("reached")}
            </span>
          ) : (
            <span>
              {t("toGo", { time: formatClock(status.best - status.target) })}
            </span>
          ))}
      </span>
    </li>
  );
}
