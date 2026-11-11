import { ChevronDown, Lightbulb } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { effortDistanceLabel } from "@/features/profile/distance-label";
import type { TrainingBase } from "@/features/training/components/training-view";
import type { Workout } from "@/features/training/workouts";
import { EFFORT_BG } from "@/features/training/zones";
import { Link } from "@/i18n/navigation";
import {
  formatClock,
  formatPacePerKm,
  formatRoundDistance,
  formatSportPace,
} from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import type { Tip, TipValue } from "../tips";

/** Shared pieces of the goal cards. */

/**
 * Tips (owner feedback 2026-11-12): the 3 most relevant as a few words each, and "Read more" opens at
 * most 5 as full sentences. We shouldn't decide too much for people.
 */
const SHORT_TIPS = 3;
const DETAILED_TIPS = 5;

/** The tips of a goal (`tips.ts`): short ones, and the details behind a button. */
export function GoalTips({ tips, units }: { tips: Tip[]; units: Units }) {
  const t = useTranslations("Goals");
  if (tips.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <TipList tips={tips.slice(0, SHORT_TIPS)} units={units} short />
      <details className="group/tips">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
          <ChevronDown className="size-3.5 transition-transform group-open/tips:rotate-180" />
          <span className="group-open/tips:hidden">{t("readMore")}</span>
          <span className="hidden group-open/tips:inline">{t("readLess")}</span>
        </summary>
        <div className="pt-1.5">
          <TipList tips={tips.slice(0, DETAILED_TIPS)} units={units} />
        </div>
      </details>
    </div>
  );
}

function TipList({
  tips,
  units,
  short = false,
}: {
  tips: Tip[];
  units: Units;
  short?: boolean;
}) {
  const tLong = useTranslations("Goals.tips");
  const tShort = useTranslations("Goals.tipsShort");
  const tSports = useTranslations("Activities.sports");
  const tDistances = useTranslations("Distances");
  const format = useFormatter();
  const locale = useLocale();
  const names = {
    halfMarathon: tDistances("halfMarathon"),
    marathon: tDistances("marathon"),
  };

  const show = (value: TipValue): string | number => {
    switch (value.kind) {
      case "distance":
        return formatRoundDistance(value.meters, units);
      case "label":
        return effortDistanceLabel(value.sport, value.meters, locale, names);
      case "time":
        return formatClock(value.seconds);
      case "runPace":
        return formatPacePerKm(1000, value.secondsPerKm, units);
      case "pace":
        return (
          formatSportPace(value.sport, value.meters, value.seconds, units) ?? ""
        );
      case "number":
        return format.number(value.value, { maximumFractionDigits: 1 });
      case "sport":
        return tSports(value.sport);
    }
  };
  const text = (tip: Tip) => {
    const values = Object.fromEntries(
      Object.entries(tip.values ?? {}).map(([name, value]) => [
        name,
        show(value),
      ]),
    );
    return short ? tShort(tip.key, values) : tLong(tip.key, values);
  };

  return (
    <ul
      className={cn(
        "flex flex-col text-sm",
        short ? "gap-1 font-medium" : "gap-1.5 text-muted-foreground",
      )}
    >
      {tips.map((tip) => (
        <li key={tip.key} className="flex gap-2">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-zone-3" />
          <span>{text(tip)}</span>
        </li>
      ))}
    </ul>
  );
}

export function GoalWorkouts({
  workouts,
  trainingBase,
}: {
  workouts: Workout[];
  trainingBase: TrainingBase;
}) {
  const t = useTranslations("Goals");
  const tTraining = useTranslations("Training");
  if (workouts.length === 0) return null;
  return (
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
                className={cn("size-2 rounded-full", EFFORT_BG[workout.effort])}
              />
              {tTraining(`workouts.${workout.id}.name`)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** How far the best is from the target: a bar that fills up as the best gets closer. */
export function GapBar({
  target,
  best,
  achieved,
}: {
  target: number;
  best: number;
  achieved: boolean;
}) {
  return (
    <span className="block h-2 overflow-hidden rounded-full bg-muted">
      <span
        className={cn(
          "block h-full rounded-full",
          achieved ? "bg-zone-2" : "bg-linear-to-r from-zone-3 to-zone-5",
        )}
        style={{ width: `${Math.min(100, (target / best) * 100)}%` }}
      />
    </span>
  );
}
