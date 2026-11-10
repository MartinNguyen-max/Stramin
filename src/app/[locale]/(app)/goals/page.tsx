import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { getCurrentUser } from "@/features/auth/current-user";
import { GoalCard } from "@/features/goals/components/goal-card";
import { GoalForm } from "@/features/goals/components/goal-form";
import { type Goal, listGoals } from "@/features/goals/data";
import { averageWeeklyMeters } from "@/features/goals/feedback";
import { loadBestEfforts } from "@/features/profile/best-efforts-data";
import { getOrCreateProfile } from "@/features/profile/data";
import { effortDistanceLabel } from "@/features/profile/distance-label";
import {
  distanceKey,
  EFFORT_DISTANCES,
  EFFORT_SPORTS,
} from "@/lib/analytics/best-efforts";
import { today } from "@/lib/dates";
import type { Units, WeekStart } from "@/lib/preferences";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Goals");
  return { title: `${t("title")} · Stramin` };
}

/** Goals (UI_SPEC §4): new goal form and one card per goal with feedback. */
export default function GoalsPage() {
  return (
    <Suspense fallback={<GoalsSkeleton />}>
      <GoalsContent />
    </Suspense>
  );
}

async function GoalsContent() {
  const t = await getTranslations("Goals");
  const tDistances = await getTranslations("Distances");
  const user = await getCurrentUser();
  const locale = (await getLocale()) as "en" | "da";

  let units: Units = "metric";
  let weekStart: WeekStart = "monday";
  try {
    const profile = await getOrCreateProfile(user, locale);
    units = profile.units;
    weekStart = profile.weekStart;
  } catch (error) {
    console.error("[goals] profile unavailable", error);
  }

  let goals: Goal[] | null = null;
  try {
    goals = await listGoals(user);
  } catch (error) {
    console.error("[goals] unavailable", error);
  }
  const { efforts, activities } = await loadBestEfforts(user);

  const serverToday = today();
  const names = {
    halfMarathon: tDistances("halfMarathon"),
    marathon: tDistances("marathon"),
  };
  const distanceLabels: Record<string, string> = {};
  for (const sport of EFFORT_SPORTS) {
    for (const meters of EFFORT_DISTANCES[sport]) {
      distanceLabels[`${sport}-${distanceKey(meters)}`] = effortDistanceLabel(
        sport,
        meters,
        locale,
        names,
      );
    }
  }
  const bests = efforts.map((effort) => ({
    sport: effort.sport,
    distance: distanceKey(effort.distance),
    seconds: effort.seconds,
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
        {!activities && (
          <p className="text-sm text-muted-foreground">{t("connectHint")}</p>
        )}
      </div>

      {goals === null ? (
        <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
          {t("unavailable")}
        </p>
      ) : (
        <>
          <GoalForm
            bests={bests}
            distanceLabels={distanceLabels}
            startOpen={goals.length === 0}
          />
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  efforts={efforts}
                  metersPerWeek={
                    activities
                      ? averageWeeklyMeters(
                          activities,
                          goal.sport,
                          serverToday,
                          weekStart,
                        )
                      : null
                  }
                  units={units}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GoalsSkeleton() {
  const t = useTranslations("Goals");
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <ZoneSpinner size={72} label={t("loading")} />
    </div>
  );
}
