import { useFormatter, useTranslations } from "next-intl";
import {
  formatClock,
  formatDuration,
  formatPacePer100,
  formatPacePerKm,
} from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import {
  maxZone,
  type PersonalPaces,
  stepPace,
  stepPaceRange,
  stepSeconds,
  workoutSeconds,
  zoneOf,
} from "../plan";
import type { Amount, Step, Target, Workout } from "../workouts";
import { EFFORT_BORDER, ZONE_BG, type Zone } from "../zones";

type Props = { workout: Workout; paces: PersonalPaces; units: Units };

/** One workout of the catalog with its steps and personal paces (TRN-1..4). */
export function WorkoutCard({ workout, paces, units }: Props) {
  const t = useTranslations("Training");
  const tZones = useTranslations("Zones");
  const zone = maxZone(workout);
  const lowest = Math.min(
    ...workout.steps.flatMap((step) =>
      step.type === "repeat"
        ? [zoneOf(step.work.target)]
        : [zoneOf(step.target)],
    ),
  ) as Zone;

  return (
    <article
      id={workout.id}
      className={cn(
        "flex scroll-mt-24 flex-col gap-3 rounded-2xl border border-t-4 bg-card p-4",
        EFFORT_BORDER[workout.effort],
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="font-semibold">{t(`workouts.${workout.id}.name`)}</h3>
          <p className="text-sm text-muted-foreground">
            {t(`workouts.${workout.id}.description`)}
          </p>
        </div>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-bold text-black/80",
              ZONE_BG[zone],
            )}
          >
            {lowest === zone
              ? tZones("short", { zone })
              : `${tZones("short", { zone: lowest })}–${zone}`}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {t("duration", {
              time: formatDuration(workoutSeconds(workout, paces)),
            })}
          </span>
        </span>
      </header>
      <ol className="flex flex-col gap-1.5 text-sm">
        {workout.steps.map((step, index) => (
          <StepLine
            // biome-ignore lint/suspicious/noArrayIndexKey: steps are static and never reordered.
            key={index}
            step={step}
            sport={workout.sport}
            paces={paces}
            units={units}
          />
        ))}
      </ol>
    </article>
  );
}

function useAmountLabel() {
  const t = useTranslations("Training.amount");
  const format = useFormatter();
  return (amount: Amount) => {
    if ("seconds" in amount) {
      return amount.seconds % 60 === 0
        ? t("minutes", { value: amount.seconds / 60 })
        : t("seconds", { value: amount.seconds });
    }
    return amount.meters < 1000
      ? `${format.number(amount.meters)} m`
      : `${format.number(amount.meters / 1000, { maximumFractionDigits: 1 })} km`;
  };
}

/** "1:28 (3:40 /km)", "5:07–5:38 /km", "1:52 /100m" or nothing (bike, or no best effort). */
function usePaceLabel(
  sport: Workout["sport"],
  paces: PersonalPaces,
  units: Units,
) {
  return (amount: Amount, target: Target): string | null => {
    const range = stepPaceRange(sport, target, paces);
    if (range) {
      return `${formatClock(range[0])}–${formatPacePerKm(1000, range[1], units)}`;
    }
    const pace = stepPace(sport, target, paces);
    if (pace === null) return null;
    if (sport === "swim") return formatPacePer100(100, pace, units);
    const perKm = formatPacePerKm(1000, pace, units);
    if ("meters" in amount && amount.meters < 3000) {
      const seconds = stepSeconds(sport, amount, target, paces);
      return seconds === null ? perKm : `${formatClock(seconds)} (${perKm})`;
    }
    return perKm;
  };
}

function StepLine({
  step,
  sport,
  paces,
  units,
}: {
  step: Step;
  sport: Workout["sport"];
  paces: PersonalPaces;
  units: Units;
}) {
  const t = useTranslations("Training.steps");
  const amountLabel = useAmountLabel();
  const paceLabel = usePaceLabel(sport, paces, units);

  if (step.type === "repeat") {
    const workPace = paceLabel(step.work.amount, step.work.target);
    const restPace = step.rest
      ? paceLabel(step.rest.amount, step.rest.target)
      : null;
    return (
      <li className="flex flex-col gap-0.5">
        <span className="flex items-baseline gap-2">
          <ZoneDot zone={zoneOf(step.work.target)} />
          <span className="font-medium">
            {step.reps} × {amountLabel(step.work.amount)}
          </span>
          {workPace && (
            <span className="text-muted-foreground tabular-nums">
              · {workPace}
            </span>
          )}
        </span>
        {step.rest && (
          <span className="flex items-baseline gap-2 pl-4 text-xs text-muted-foreground">
            <ZoneDot zone={zoneOf(step.rest.target)} small />
            {t("between", {
              amount: [amountLabel(step.rest.amount), restPace]
                .filter(Boolean)
                .join(" · "),
            })}
          </span>
        )}
      </li>
    );
  }

  const pace = paceLabel(step.amount, step.target);
  return (
    <li className="flex items-baseline gap-2">
      <ZoneDot zone={zoneOf(step.target)} />
      <span>
        <span className="text-muted-foreground">{t(step.type)} </span>
        <span className="font-medium">{amountLabel(step.amount)}</span>
        {pace && (
          <span className="text-muted-foreground tabular-nums"> · {pace}</span>
        )}
      </span>
    </li>
  );
}

function ZoneDot({ zone, small = false }: { zone: Zone; small?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "shrink-0 translate-y-[-1px] rounded-full",
        small ? "size-1.5" : "size-2",
        ZONE_BG[zone],
      )}
    />
  );
}
