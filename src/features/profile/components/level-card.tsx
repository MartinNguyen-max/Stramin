import { ChevronDown } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { SPORT_BG } from "@/features/activities/sport-style";
import { ZONE_BG, type Zone } from "@/features/training/zones";
import {
  type BestEffort,
  type EffortSport,
  findEffort,
} from "@/lib/analytics/best-efforts";
import {
  bestVdot,
  equivalentTime,
  PACE_ZONES,
  type PaceTarget,
  riegel,
  strongestRiegelEffort,
  trainingPaces,
} from "@/lib/analytics/running";
import { formatClock, formatPacePerKm, formatSportPace } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { effortDistanceLabel } from "../distance-label";

/** The predicted distances per sport (BE-9). */
const PREDICTED: Record<EffortSport, readonly number[]> = {
  run: [5000, 10_000, 21_097.5, 42_195],
  bike: [20_000, 40_000, 90_000, 180_000],
  swim: [400, 1000, 1900, 3800],
};

const PACE_ORDER: PaceTarget[] = [
  "recovery",
  "easy",
  "marathon",
  "threshold",
  "interval",
  "repetition",
];

type Prediction = { distance: number; seconds: number; best?: number };

/**
 * Your level and predicted times for all three sports in one card (owner feedback 2026-11-12):
 * running from VDOT, bike and swim with Riegel's formula, side by side. The running training paces
 * open on demand.
 */
export function LevelCard({
  efforts,
  units,
}: {
  efforts: BestEffort[];
  units: Units;
}) {
  const t = useTranslations("Profile.level");
  const tPredictions = useTranslations("Profile.predictions");
  const format = useFormatter();
  const locale = useLocale();
  const tDistances = useTranslations("Distances");
  const names = {
    halfMarathon: tDistances("halfMarathon"),
    marathon: tDistances("marathon"),
  };
  const label = (sport: EffortSport, meters: number) =>
    effortDistanceLabel(sport, meters, locale, names);

  const run = bestVdot(efforts.filter((effort) => effort.sport === "run"));
  const predict = (sport: EffortSport): Prediction[] | null => {
    if (sport === "run") {
      return run
        ? PREDICTED.run.map((distance) => ({
            distance,
            seconds: equivalentTime(run.level, distance),
            best: findEffort(efforts, "run", distance)?.seconds,
          }))
        : null;
    }
    const basis = strongestRiegelEffort(
      efforts.filter((effort) => effort.sport === sport),
    );
    return basis
      ? PREDICTED[sport].map((distance) => ({
          distance,
          seconds: riegel(basis.seconds, basis.distance, distance),
          best: findEffort(efforts, sport, distance)?.seconds,
        }))
      : null;
  };
  const basisText = (sport: EffortSport): string | null => {
    if (sport === "run") {
      return run
        ? t("basis", {
            distance: label("run", run.distance),
            time: formatClock(run.seconds),
          })
        : null;
    }
    const basis = strongestRiegelEffort(
      efforts.filter((effort) => effort.sport === sport),
    );
    return basis
      ? tPredictions("basis", {
          distance: label(sport, basis.distance),
          time: formatClock(basis.seconds),
          pace:
            formatSportPace(sport, basis.distance, basis.seconds, units) ?? "",
        })
      : null;
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
      <h2 className="font-semibold">{t("combinedTitle")}</h2>

      <div className="grid gap-4 md:grid-cols-3">
        {(["run", "bike", "swim"] as const).map((sport) => (
          <SportColumn
            key={sport}
            sport={sport}
            predictions={predict(sport)}
            basis={basisText(sport)}
            method={t(sport === "run" ? "methodRun" : "methodRiegel")}
            badge={
              sport === "run" && run ? (
                <span className="rounded-full bg-background px-2 py-0.5 text-sm font-bold tabular-nums">
                  {t("vdot", {
                    value: format.number(run.level, {
                      maximumFractionDigits: 1,
                    }),
                  })}
                </span>
              ) : null
            }
            label={label}
            units={units}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{t("combinedNote")}</p>

      {run && (
        <details className="group/paces border-t pt-3">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <ChevronDown className="size-4 transition-transform group-open/paces:rotate-180" />
            {t("pacesTitleRun")}
          </summary>
          <Paces level={run.level} units={units} />
        </details>
      )}
    </section>
  );
}

function SportColumn({
  sport,
  predictions,
  basis,
  method,
  badge,
  label,
  units,
}: {
  sport: EffortSport;
  predictions: Prediction[] | null;
  basis: string | null;
  /** How the times are predicted: VDOT for running (only there), Riegel for bike and swim. */
  method: string;
  /** The running VDOT, shown in the running column's header. */
  badge: ReactNode;
  label: (sport: EffortSport, meters: number) => string;
  units: Units;
}) {
  const t = useTranslations("Profile.level");
  const tSports = useTranslations("Activities.sports");
  const tPredictions = useTranslations("Profile.predictions");
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3">
      <h3 className="flex items-center justify-between gap-2 text-sm font-semibold">
        <span className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-full", SPORT_BG[sport])} />
          {tSports(sport)}
        </span>
        {badge}
      </h3>
      {predictions ? (
        <>
          <ul className="flex flex-col divide-y text-sm">
            {predictions.map((prediction) => (
              <li
                key={prediction.distance}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 py-1.5"
              >
                <span className="text-muted-foreground">
                  {label(sport, prediction.distance)}
                </span>
                <span className="text-right font-semibold tabular-nums">
                  {formatClock(prediction.seconds)}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {prediction.best !== undefined &&
                    t("yourBest", { time: formatClock(prediction.best) })}
                </span>
                <span className="text-right text-xs text-muted-foreground tabular-nums">
                  {formatSportPace(
                    sport,
                    prediction.distance,
                    prediction.seconds,
                    units,
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            {basis} {method}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {sport === "run" ? t("noRuns") : tPredictions(`noEfforts.${sport}`)}
        </p>
      )}
    </div>
  );
}

/** The running training paces from VDOT (TRN-3, ADR 0010). */
function Paces({ level, units }: { level: number; units: Units }) {
  const t = useTranslations("Profile.level");
  const tZones = useTranslations("Zones");
  const paces = trainingPaces(level);
  const pace = (secondsPerKm: number) =>
    formatPacePerKm(1000, secondsPerKm, units);
  return (
    <ul className="grid gap-2 pt-3 sm:grid-cols-2 lg:grid-cols-3">
      {PACE_ORDER.map((target) => {
        const zone = PACE_ZONES[target] as Zone;
        const value = paces[target];
        const main = Array.isArray(value)
          ? `${formatClock(value[0])}–${pace(value[1])}`
          : pace(value);
        const per400 =
          !Array.isArray(value) &&
          (target === "interval" || target === "repetition")
            ? t("per400", { time: formatClock((value * 400) / 1000) })
            : null;
        return (
          <li
            key={target}
            className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2"
          >
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-black/80",
                ZONE_BG[zone],
              )}
            >
              {tZones("short", { zone })}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-xs text-muted-foreground">
                {t(`paces.${target}`)} · {tZones(`names.${zone}`)}
              </span>
              <span className="font-semibold tabular-nums">{main}</span>
              {per400 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {per400}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
