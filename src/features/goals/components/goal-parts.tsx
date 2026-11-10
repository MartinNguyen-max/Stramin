import { Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TrainingBase } from "@/features/training/components/training-view";
import type { Workout } from "@/features/training/workouts";
import { EFFORT_BG } from "@/features/training/zones";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Shared pieces of the goal cards. */

export function GoalTips({ tips }: { tips: string[] }) {
  if (tips.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {tips.map((tip) => (
        <li key={tip} className="flex gap-2">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-zone-3" />
          <span>{tip}</span>
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
