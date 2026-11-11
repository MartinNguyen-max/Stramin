import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { getCurrentUser } from "@/features/auth/current-user";
import { GoalCard } from "@/features/goals/components/goal-card";
import { GoalForm } from "@/features/goals/components/goal-form";
import { GoalsTabs } from "@/features/goals/components/goals-tabs";
import { type Goal, listGoals } from "@/features/goals/data";
import {
  draftFromParams,
  goalDistanceLabels,
  plainBests,
} from "@/features/goals/form-data";
import { trainingStats } from "@/features/goals/tips";
import { loadBestEfforts } from "@/features/profile/best-efforts-data";
import { getOrCreateProfile } from "@/features/profile/data";
import { FTP_SHARE } from "@/lib/analytics/power";
import { today } from "@/lib/dates";
import type { Units, WeekStart } from "@/lib/preferences";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Goals");
  return { title: `${t("title")} · Stramin` };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Goals (UI_SPEC §4): new goal form and one card per goal with feedback. A link from the pace
 * calculator ("Set as goal") opens the form filled in.
 */
export default function GoalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<GoalsSkeleton />}>
      <GoalsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function GoalsContent({ searchParams }: { searchParams: SearchParams }) {
  const draft = draftFromParams(await searchParams);
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
  const { efforts, activities, power } = await loadBestEfforts(user);
  const twenty = power.find((entry) => entry.duration === 1200);
  const ftp = twenty ? twenty.watts * FTP_SHARE : null;

  const stats = activities
    ? trainingStats(activities, today(), weekStart)
    : null;
  const distanceLabels = goalDistanceLabels(locale, {
    halfMarathon: tDistances("halfMarathon"),
    marathon: tDistances("marathon"),
  });
  const bests = plainBests(efforts);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
        <div className="pt-2">
          <GoalsTabs base="/goals" />
        </div>
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
            units={units}
            startOpen={goals.length === 0}
            draft={draft}
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
                  stats={stats}
                  ftp={ftp}
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
