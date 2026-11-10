import { ChevronDown } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useHours } from "@/i18n/use-hours";
import {
  formatClock,
  formatPacePer100,
  formatPacePerKm,
  formatSportDistance,
} from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import {
  maxZone,
  type PersonalPaces,
  type Segment,
  stepPace,
  stepPaceRange,
  stepSeconds,
  workoutMeters,
  workoutSeconds,
  workoutSegments,
  zoneOf,
} from "../plan";
import type { Amount, Step, Target, Workout } from "../workouts";
import { EFFORT_BORDER, ZONE_BG, type Zone } from "../zones";

type Props = { workout: Workout; paces: PersonalPaces; units: Units };

/**
 * One workout of the catalog (TRN-1..4): name, a graph of its blocks (owner feedback T1), time and
 * distance (T3). Tap it to see the steps with personal paces (T2).
 */
export function WorkoutCard({ workout, paces, units }: Props) {
  const t = useTranslations("Training");
  const tZones = useTranslations("Zones");
  const hours = useHours();
  const zone = maxZone(workout);
  const lowest = Math.min(
    ...workout.steps.flatMap((step) =>
      step.type === "repeat"
        ? [zoneOf(step.work.target)]
        : [zoneOf(step.target)],
    ),
  ) as Zone;
  const meters = workoutMeters(workout, paces);
  const duration = t("duration", {
    time: hours(workoutSeconds(workout, paces)),
  });
  const distance =
    meters === null
      ? null
      : t("distance", {
          distance: formatSportDistance(workout.sport, meters, units),
        });

  return (
    <details
      id={workout.id}
      className={cn(
        "group scroll-mt-24 rounded-2xl border border-t-4 bg-card",
        EFFORT_BORDER[workout.effort],
      )}
    >
      <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-semibold">
              {t(`workouts.${workout.id}.name`)}
            </span>
            <span className="text-sm text-muted-foreground">
              {t(`workouts.${workout.id}.description`)}
            </span>
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-black/80",
              ZONE_BG[zone],
            )}
          >
            {lowest === zone
              ? tZones("short", { zone })
              : `${tZones("short", { zone: lowest })}–${zone}`}
          </span>
        </span>
        <WorkoutProfile segments={workoutSegments(workout, paces)} />
        <span className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {[duration, distance].filter(Boolean).join(" · ")}
          </span>
          <span className="flex items-center gap-1 font-medium text-foreground">
            <span className="group-open:hidden">{t("showSteps")}</span>
            <span className="hidden group-open:inline">{t("hideSteps")}</span>
            <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
          </span>
        </span>
      </summary>
      <ol className="flex flex-col gap-1.5 border-t px-4 py-3 text-sm">
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
    </details>
  );
}

/** The blocks of a workout: width = time, height and color = zone (owner feedback T1). */
function WorkoutProfile({ segments }: { segments: Segment[] }) {
  const t = useTranslations("Training");
  const total = segments.reduce((sum, segment) => sum + segment.seconds, 0);
  if (total === 0) return null;
  return (
    <span
      role="img"
      aria-label={t("profileLabel")}
      className="flex h-12 items-end gap-px rounded-lg bg-muted/40 px-1 pt-1"
    >
      {segments.map((segment, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: blocks are static and never reordered.
          key={index}
          className={cn("min-w-0.5 rounded-t-sm", ZONE_BG[segment.zone])}
          style={{
            width: `${(segment.seconds / total) * 100}%`,
            height: `${segment.zone * 20}%`,
          }}
        />
      ))}
    </span>
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
