import { useLocale, useTranslations } from "next-intl";
import { SPORT_BG } from "@/features/activities/sport-style";
import { effortDistanceLabel } from "@/features/profile/distance-label";
import { formatClock, formatSportPace } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import type { TriathlonGoal } from "../data";
import { triathlonTips } from "../tips";
import { LEGS, type Leg, TRIATHLONS } from "../triathlon";
import { DeleteGoalButton } from "./delete-goal-button";
import type { GoalCardProps } from "./goal-card";
import { TipList } from "./goal-parts";

/**
 * A triathlon goal (G1), kept minimal (owner feedback 2026-11-12, batch 6): a row per discipline with
 * its target and pace. Below it, the tips: the time each leg needs when fresh, because race day comes
 * with fatigue ("3:30 in an Ironman ≈ a 3:03 marathon"), then one weekly volume line per discipline
 * that trains too little. No predicted times, no "already reached": a prediction isn't a
 * result.
 */
export function TriathlonGoalCard({
  goal,
  stats,
  units,
  readOnly = false,
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
  const tips = triathlonTips(goal.race, goal.splits, stats);

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
        {LEGS.map((leg) => (
          <LegRow
            key={leg}
            leg={leg}
            name={tSports(leg)}
            distance={race.legs[leg]}
            distanceLabel={label(leg, race.legs[leg])}
            target={goal.splits[leg]}
            units={units}
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
      {tips.length > 0 && <TipList tips={tips} units={units} />}
    </article>
  );
}

function LegRow({
  leg,
  name,
  distance,
  distanceLabel,
  target,
  units,
}: {
  leg: Leg;
  name: string;
  distance: number;
  distanceLabel: string;
  target: number;
  units: Units;
}) {
  const pace = (seconds: number) =>
    formatSportPace(leg, distance, seconds, units) ?? "";
  return (
    <li className="flex flex-col gap-0.5 px-3 py-2 text-sm">
      <span className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 font-medium">
          <span className={cn("size-2 rounded-full", SPORT_BG[leg])} />
          {name}
          <span className="font-normal text-muted-foreground">
            {distanceLabel}
          </span>
        </span>
        <span className="text-right tabular-nums">
          <span className="font-semibold">{formatClock(target)}</span>
          <span className="text-muted-foreground"> · {pace(target)}</span>
        </span>
      </span>
    </li>
  );
}
