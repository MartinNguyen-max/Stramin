import { Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { SPORT_ICON, SPORT_TEXT } from "@/features/activities/sport-style";
import { effortDistanceLabel } from "@/features/profile/distance-label";
import { Link } from "@/i18n/navigation";
import { useHours } from "@/i18n/use-hours";
import { EFFORT_SPORTS, type EffortSport } from "@/lib/analytics/best-efforts";
import { formatClock } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import {
  CREATE_EFFORTS,
  type CreateEffort,
  durationsFor,
  isCreateEffort,
  suggestWorkouts,
  workoutById,
} from "../generator";
import type { PersonalPaces } from "../plan";
import { type Workout, workoutsFor } from "../workouts";
import { EFFORT_BG, EFFORTS, type Effort } from "../zones";
import { WorkoutCard } from "./workout-card";

/** Pages that show the training inspiration. */
export type TrainingBase = "/training" | "/demo/training";

export const TRAINING_TABS = ["classics", "create", "favorites"] as const;
export type TrainingTab = (typeof TRAINING_TABS)[number];

/** What the URL asks for. Each tab keeps only its own choices. */
export type TrainingParams =
  | { tab: "classics"; sport: EffortSport; effort?: Effort }
  | {
      tab: "create";
      sport?: EffortSport;
      minutes?: number;
      effort?: CreateEffort;
    }
  | { tab: "favorites" };

type ViewProps = {
  base: TrainingBase;
  params: TrainingParams;
  paces: PersonalPaces;
  units: Units;
  /** The user's favorite ids, newest first; null when there are none to show (demo, or unavailable). */
  favorites: string[] | null;
  /** Why `favorites` is null, shown on the Favorites tab. */
  favoritesNote?: "demo" | "unavailable";
};

/**
 * Training inspiration (UI_SPEC §5, TRN-1..5): "Classics | Create | Favorites" (owner feedback
 * 2026-11-15). Every choice lives in the URL, so the back button and links work.
 */
export function TrainingView(props: ViewProps) {
  const t = useTranslations("Training");
  const { params } = props;
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
      </div>
      <TrainingTabs
        base={props.base}
        active={params.tab}
        favoriteCount={props.favorites?.length}
      />
      {params.tab === "classics" && <Classics {...props} params={params} />}
      {params.tab === "create" && <Create {...props} params={params} />}
      {params.tab === "favorites" && <Favorites {...props} />}
    </>
  );
}

function TrainingTabs({
  base,
  active,
  favoriteCount,
}: {
  base: TrainingBase;
  active: TrainingTab;
  favoriteCount?: number;
}) {
  const t = useTranslations("Training.tabs");
  return (
    <nav className="flex w-fit gap-1 rounded-full border bg-card p-1 text-sm">
      {TRAINING_TABS.map((tab) => (
        <Link
          key={tab}
          href={{
            pathname: base,
            query: tab === "classics" ? {} : { tab },
          }}
          scroll={false}
          aria-current={tab === active ? "page" : undefined}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-1.5 font-medium transition-colors",
            tab === active
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab === "favorites" && (
            <Star
              aria-hidden
              className={cn(
                "size-3.5",
                favoriteCount ? "fill-amber-400 text-amber-400" : "",
              )}
            />
          )}
          {t(tab)}
          {tab === "favorites" && !!favoriteCount && (
            <span className="tabular-nums opacity-70">{favoriteCount}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

/* --------------------------------------------------------------- Classics */

function Classics({
  base,
  params,
  paces,
  units,
  favorites,
}: ViewProps & { params: Extract<TrainingParams, { tab: "classics" }> }) {
  const t = useTranslations("Training");
  const tSports = useTranslations("Activities.sports");
  const { sport, effort } = params;
  return (
    <>
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
              <SportChipIcon sport={option} active={option === sport} />
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
        <PaceBasis base={base} sport={sport} paces={paces} />
        <p className="text-xs">{t("placeholder")}</p>
      </div>

      <WorkoutGrid
        workouts={workoutsFor(sport, effort)}
        paces={paces}
        units={units}
        favorites={favorites}
        empty={t("empty")}
      />
    </>
  );
}

/* ----------------------------------------------------------------- Create */

/**
 * The workout builder (owner feedback 2026-11-15): sport → how long → how hard, one step after the
 * other, then 4–6 suggestions that fill exactly that time.
 */
function Create({
  base,
  params,
  paces,
  units,
  favorites,
}: ViewProps & { params: Extract<TrainingParams, { tab: "create" }> }) {
  const t = useTranslations("Training");
  const tSports = useTranslations("Activities.sports");
  const hours = useHours();
  const { sport, minutes, effort } = params;
  const query = (choice: {
    sport?: EffortSport;
    minutes?: number;
    effort?: CreateEffort;
  }) => {
    const next = { sport, minutes, effort, ...choice };
    // A swim can't be as long as a ride: drop a duration the new sport doesn't offer.
    const keepMinutes =
      next.sport &&
      next.minutes &&
      durationsFor(next.sport).includes(next.minutes);
    return {
      tab: "create",
      ...(next.sport && { sport: next.sport }),
      ...(keepMinutes && { minutes: String(next.minutes) }),
      ...(keepMinutes && next.effort && { effort: next.effort }),
    };
  };
  const suggestions =
    sport && minutes && effort
      ? suggestWorkouts(sport, minutes, effort, paces)
      : null;

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t("create.intro")}</p>

        <Step label={t("create.sportStep")}>
          {EFFORT_SPORTS.map((option) => (
            <Link
              key={option}
              href={{ pathname: base, query: query({ sport: option }) }}
              scroll={false}
              aria-current={option === sport ? "true" : undefined}
              className={chip(option === sport)}
            >
              <SportChipIcon sport={option} active={option === sport} />
              {tSports(option)}
            </Link>
          ))}
        </Step>

        {sport && (
          <Step label={t("create.durationStep")}>
            {durationsFor(sport).map((option) => (
              <Link
                key={option}
                href={{ pathname: base, query: query({ minutes: option }) }}
                scroll={false}
                aria-current={option === minutes ? "true" : undefined}
                className={cn(chip(option === minutes), "tabular-nums")}
              >
                {hours(option * 60)}
              </Link>
            ))}
          </Step>
        )}

        {sport && minutes && (
          <Step label={t("create.effortStep")}>
            {CREATE_EFFORTS.map((option) => (
              <Link
                key={option}
                href={{ pathname: base, query: query({ effort: option }) }}
                scroll={false}
                aria-current={option === effort ? "true" : undefined}
                className={chip(option === effort)}
              >
                <span
                  className={cn("size-2 rounded-full", EFFORT_BG[option])}
                />
                {t(`createEfforts.${option}`)}
              </Link>
            ))}
          </Step>
        )}
      </div>

      {sport && suggestions && (
        <>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="font-medium text-foreground">
                {t("create.suggestions", { count: suggestions.length })}
              </span>
              <Link
                href={{ pathname: base, query: { tab: "create" } }}
                scroll={false}
                className="text-xs underline underline-offset-4 hover:text-foreground"
              >
                {t("create.startOver")}
              </Link>
            </p>
            <PaceBasis base={base} sport={sport} paces={paces} />
          </div>
          <WorkoutGrid
            workouts={suggestions}
            paces={paces}
            units={units}
            favorites={favorites}
            empty={t("create.none")}
          />
        </>
      )}
    </>
  );
}

function Step({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------- Favorites */

/** All favorites, every sport in one list, newest first (owner feedback 2026-11-15). */
function Favorites({
  paces,
  units,
  favorites,
  favoritesNote,
}: Omit<ViewProps, "params">) {
  const t = useTranslations("Training.favorites");
  if (!favorites) {
    return (
      <p className="text-sm text-muted-foreground">
        {t(favoritesNote ?? "unavailable")}
      </p>
    );
  }
  const workouts = favorites
    .map((id) => workoutById(id, paces))
    .filter((workout): workout is Workout => workout !== null);
  return (
    <WorkoutGrid
      workouts={workouts}
      paces={paces}
      units={units}
      favorites={favorites}
      empty={
        <span className="flex items-center gap-2">
          <Star aria-hidden className="size-4 shrink-0" />
          {t("empty")}
        </span>
      }
    />
  );
}

/* ----------------------------------------------------------------- Shared */

function WorkoutGrid({
  workouts,
  paces,
  units,
  favorites,
  empty,
}: {
  workouts: Workout[];
  paces: PersonalPaces;
  units: Units;
  favorites: string[] | null;
  empty: ReactNode;
}) {
  if (workouts.length === 0) {
    return <div className="text-sm text-muted-foreground">{empty}</div>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workouts.map((workout) => (
        <WorkoutCard
          key={workout.id}
          workout={workout}
          paces={paces}
          units={units}
          favorite={favorites ? favorites.includes(workout.id) : undefined}
        />
      ))}
    </div>
  );
}

/** Where the paces come from, or how to get them. Bike uses zones only. */
function PaceBasis({
  base,
  sport,
  paces,
}: {
  base: TrainingBase;
  sport: EffortSport;
  paces: PersonalPaces;
}) {
  const t = useTranslations("Training");
  const tDistances = useTranslations("Distances");
  const locale = useLocale();
  const names = {
    halfMarathon: tDistances("halfMarathon"),
    marathon: tDistances("marathon"),
  };
  if (sport === "bike") return <p>{t("bikeNote")}</p>;
  if (sport === "run" && paces.runBasis) {
    return (
      <p>
        {t("basisRun", {
          distance: effortDistanceLabel(
            "run",
            paces.runBasis.distance,
            locale,
            names,
          ),
          time: formatClock(paces.runBasis.seconds),
          vdot: paces.runBasis.level.toFixed(1),
        })}
      </p>
    );
  }
  if (sport === "swim" && paces.swimBasis) {
    return (
      <p>
        {t("basisSwim", {
          distance: effortDistanceLabel(
            "swim",
            paces.swimBasis.distance,
            locale,
            names,
          ),
          time: formatClock(paces.swimBasis.seconds),
        })}
      </p>
    );
  }
  return (
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
  );
}

function chip(active: boolean) {
  return cn(
    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
    active
      ? "border-foreground bg-foreground text-background"
      : "text-muted-foreground hover:text-foreground",
  );
}

function SportChipIcon({
  sport,
  active,
}: {
  sport: EffortSport;
  active: boolean;
}) {
  const Icon = SPORT_ICON[sport];
  return (
    <Icon
      aria-hidden
      className={cn("size-4", active ? "text-background" : SPORT_TEXT[sport])}
    />
  );
}

/** Reads the tab and its choices from the URL; unknown values fall back to the defaults. */
export function readTrainingParams(
  params: Record<string, string | string[] | undefined>,
): TrainingParams {
  const first = (key: string) => {
    const value = params[key];
    return String((Array.isArray(value) ? value[0] : value) ?? "");
  };
  const tab = first("tab");
  const sportText = first("sport");
  const effortText = first("effort");
  const sport = (EFFORT_SPORTS as readonly string[]).includes(sportText)
    ? (sportText as EffortSport)
    : undefined;

  if (tab === "favorites") return { tab };
  if (tab === "create") {
    const minutes = Number(first("minutes"));
    const validMinutes =
      sport && durationsFor(sport).includes(minutes) ? minutes : undefined;
    return {
      tab,
      sport,
      minutes: validMinutes,
      effort:
        validMinutes && isCreateEffort(effortText) ? effortText : undefined,
    };
  }
  return {
    tab: "classics",
    sport: sport ?? "run",
    effort: (EFFORTS as readonly string[]).includes(effortText)
      ? (effortText as Effort)
      : undefined,
  };
}
