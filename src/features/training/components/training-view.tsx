import { useLocale, useTranslations } from "next-intl";
import { SPORT_BG } from "@/features/activities/sport-style";
import { effortDistanceLabel } from "@/features/profile/distance-label";
import { Link } from "@/i18n/navigation";
import { EFFORT_SPORTS, type EffortSport } from "@/lib/analytics/best-efforts";
import { formatClock } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import type { PersonalPaces } from "../plan";
import { workoutsFor } from "../workouts";
import { EFFORT_BG, EFFORTS, type Effort } from "../zones";
import { WorkoutCard } from "./workout-card";

/** Pages that show the catalog. */
export type TrainingBase = "/training" | "/demo/training";

/** The training catalog with its filters (UI_SPEC §5, TRN-1..5). Filters live in the URL. */
export function TrainingView({
  base,
  sport,
  effort,
  paces,
  units,
}: {
  base: TrainingBase;
  sport: EffortSport;
  effort?: Effort;
  paces: PersonalPaces;
  units: Units;
}) {
  const t = useTranslations("Training");
  const tSports = useTranslations("Activities.sports");
  const tDistances = useTranslations("Distances");
  const locale = useLocale();
  const workouts = workoutsFor(sport, effort);
  const names = {
    halfMarathon: tDistances("halfMarathon"),
    marathon: tDistances("marathon"),
  };

  const chip = (active: boolean) =>
    cn(
      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
      active
        ? "border-foreground bg-foreground text-background"
        : "text-muted-foreground hover:text-foreground",
    );

  const basis =
    sport === "run" && paces.runBasis
      ? t("basisRun", {
          distance: effortDistanceLabel(
            "run",
            paces.runBasis.distance,
            locale,
            names,
          ),
          time: formatClock(paces.runBasis.seconds),
          vdot: paces.runBasis.level.toFixed(1),
        })
      : sport === "swim" && paces.swimBasis
        ? t("basisSwim", {
            distance: effortDistanceLabel(
              "swim",
              paces.swimBasis.distance,
              locale,
              names,
            ),
            time: formatClock(paces.swimBasis.seconds),
          })
        : null;

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      <div className="flex flex-col gap-3">
        <nav aria-label={t("sport")} className="flex flex-wrap gap-2">
          {EFFORT_SPORTS.map((option) => (
            <Link
              key={option}
              href={{
                pathname: base,
                query: { sport: option, ...(effort && { effort }) },
              }}
              scroll={false}
              aria-current={option === sport ? "true" : undefined}
              className={chip(option === sport)}
            >
              <span className={cn("size-2 rounded-full", SPORT_BG[option])} />
              {tSports(option)}
            </Link>
          ))}
        </nav>
        <nav aria-label={t("effortLabel")} className="flex flex-wrap gap-2">
          <Link
            href={{ pathname: base, query: { sport } }}
            scroll={false}
            aria-current={!effort ? "true" : undefined}
            className={chip(!effort)}
          >
            {t("efforts.all")}
          </Link>
          {EFFORTS.map((option) => (
            <Link
              key={option}
              href={{ pathname: base, query: { sport, effort: option } }}
              scroll={false}
              aria-current={option === effort ? "true" : undefined}
              className={chip(option === effort)}
            >
              <span className={cn("size-2 rounded-full", EFFORT_BG[option])} />
              {t(`efforts.${option}`)}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        {sport === "bike" ? (
          <p>{t("bikeNote")}</p>
        ) : basis ? (
          <p>{basis}</p>
        ) : (
          <p>
            {t("noPaces")}{" "}
            {base === "/training" && (
              <Link
                href="/profile"
                className="font-medium text-foreground underline underline-offset-4"
              >
                {t("toProfile")}
              </Link>
            )}
          </p>
        )}
        <p className="text-xs">{t("placeholder")}</p>
      </div>

      {workouts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              paces={paces}
              units={units}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}
    </>
  );
}

/** Reads the filters from the URL; unknown values fall back to running and all efforts. */
export function readTrainingFilters(
  params: Record<string, string | string[] | undefined>,
): {
  sport: EffortSport;
  effort?: Effort;
} {
  const sport = String(params.sport ?? "");
  const effort = String(params.effort ?? "");
  return {
    sport: (EFFORT_SPORTS as readonly string[]).includes(sport)
      ? (sport as EffortSport)
      : "run",
    effort: (EFFORTS as readonly string[]).includes(effort)
      ? (effort as Effort)
      : undefined,
  };
}
