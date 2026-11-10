import { useLocale, useTranslations } from "next-intl";
import { SPORT_BG } from "@/features/activities/sport-style";
import { type BestEffort, findEffort } from "@/lib/analytics/best-efforts";
import { riegel, strongestRiegelEffort } from "@/lib/analytics/running";
import { formatClock, formatSportPace } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { effortDistanceLabel } from "../distance-label";

/** The race distances predicted for bike and swim (triathlon distances, owner feedback 2026-11-11, P5). */
const PREDICTED = {
  bike: [20_000, 40_000, 90_000, 180_000],
  swim: [400, 1000, 1900, 3800],
} as const;

type PredictedSport = keyof typeof PREDICTED;

/** Predicted bike and swim times with Riegel's formula, next to the user's own bests (P5). */
export function PredictionsCard({
  efforts,
  units,
}: {
  efforts: BestEffort[];
  units: Units;
}) {
  const t = useTranslations("Profile.predictions");
  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
      <h2 className="font-semibold">{t("title")}</h2>
      {(Object.keys(PREDICTED) as PredictedSport[]).map((sport) => (
        <SportPredictions
          key={sport}
          sport={sport}
          efforts={efforts}
          units={units}
        />
      ))}
      <p className="text-xs text-muted-foreground">{t("note")}</p>
    </section>
  );
}

function SportPredictions({
  sport,
  efforts,
  units,
}: {
  sport: PredictedSport;
  efforts: BestEffort[];
  units: Units;
}) {
  const t = useTranslations("Profile.predictions");
  const tSports = useTranslations("Activities.sports");
  const tDistances = useTranslations("Distances");
  const locale = useLocale();
  const names = {
    halfMarathon: tDistances("halfMarathon"),
    marathon: tDistances("marathon"),
  };
  const label = (meters: number) =>
    effortDistanceLabel(sport, meters, locale, names);
  const basis = strongestRiegelEffort(
    efforts.filter((effort) => effort.sport === sport),
  );

  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span className={cn("size-2.5 rounded-full", SPORT_BG[sport])} />
        {tSports(sport)}
      </h3>
      {basis ? (
        <>
          <p className="text-sm text-muted-foreground">
            {t("basis", {
              distance: label(basis.distance),
              time: formatClock(basis.seconds),
              pace:
                formatSportPace(sport, basis.distance, basis.seconds, units) ??
                "",
            })}
          </p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PREDICTED[sport].map((distance) => {
              const seconds = riegel(basis.seconds, basis.distance, distance);
              const best = findEffort(efforts, sport, distance);
              return (
                <li
                  key={distance}
                  className="flex flex-col gap-0.5 rounded-xl border p-3"
                >
                  <span className="text-xs text-muted-foreground">
                    {label(distance)}
                  </span>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatClock(seconds)}
                  </span>
                  <span className="text-xs tabular-nums">
                    {formatSportPace(sport, distance, seconds, units)}
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
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t(`noEfforts.${sport}`)}
        </p>
      )}
    </div>
  );
}
