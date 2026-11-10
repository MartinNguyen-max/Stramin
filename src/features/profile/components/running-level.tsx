import { useFormatter, useLocale, useTranslations } from "next-intl";
import { ZONE_BG, type Zone } from "@/features/training/zones";
import { type BestEffort, findEffort } from "@/lib/analytics/best-efforts";
import {
  bestVdot,
  equivalentTime,
  PACE_ZONES,
  type PaceTarget,
  trainingPaces,
} from "@/lib/analytics/running";
import { formatClock, formatPacePerKm } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { effortDistanceLabel } from "../distance-label";

/** Race predictions (owner feedback P4), like Garmin's race predictor. */
const PREDICTED = [5000, 10_000, 21_097.5, 42_195];

const ORDER: PaceTarget[] = [
  "recovery",
  "easy",
  "marathon",
  "threshold",
  "interval",
  "repetition",
];

/** VDOT and the training paces that follow from it (TRN-3, ADR 0010). */
export function RunningLevel({
  efforts,
  units,
}: {
  efforts: BestEffort[];
  units: Units;
}) {
  const t = useTranslations("Profile.level");
  const tZones = useTranslations("Zones");
  const tDistances = useTranslations("Distances");
  const format = useFormatter();
  const locale = useLocale();
  const basis = bestVdot(efforts.filter((effort) => effort.sport === "run"));

  if (!basis) {
    return (
      <section className="rounded-2xl border bg-card p-4">
        <h2 className="font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("noRuns")}</p>
      </section>
    );
  }

  const paces = trainingPaces(basis.level);
  const names = {
    halfMarathon: tDistances("halfMarathon"),
    marathon: tDistances("marathon"),
  };
  const pace = (secondsPerKm: number) =>
    formatPacePerKm(1000, secondsPerKm, units);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">{t("title")}</h2>
        <span className="text-2xl font-bold tabular-nums">
          {t("vdot", {
            value: format.number(basis.level, { maximumFractionDigits: 1 }),
          })}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("basis", {
          distance: effortDistanceLabel("run", basis.distance, locale, names),
          time: formatClock(basis.seconds),
        })}{" "}
        {t("explain")}
      </p>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{t("predictions")}</h3>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PREDICTED.map((distance) => {
            const best = findEffort(efforts, "run", distance);
            return (
              <li
                key={distance}
                className="flex flex-col gap-0.5 rounded-xl border p-3"
              >
                <span className="text-xs text-muted-foreground">
                  {effortDistanceLabel("run", distance, locale, names)}
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatClock(equivalentTime(basis.level, distance))}
                </span>
                {best && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t("yourBest", { time: formatClock(best.seconds) })}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">{t("predictionsNote")}</p>
      </div>

      <h3 className="text-sm font-semibold">{t("pacesTitle")}</h3>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ORDER.map((target) => {
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
    </section>
  );
}
