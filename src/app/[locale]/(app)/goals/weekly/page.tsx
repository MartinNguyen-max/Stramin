import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { getCurrentUser } from "@/features/auth/current-user";
import { GoalsTabs } from "@/features/goals/components/goals-tabs";
import { WeeklyGoalForm } from "@/features/goals/components/weekly-goal-form";
import type { WeeklyGoal } from "@/features/goals/weekly";
import { getWeeklyGoal } from "@/features/goals/weekly-data";
import { getPreferences } from "@/features/profile/data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Goals.tabs");
  return { title: `${t("weekly")} · Stramin` };
}

/** The weekly goal, a tab of Goals (owner feedback 2026-11-17). "This week" on Home compares with it. */
export default function WeeklyGoalPage() {
  return (
    <Suspense fallback={<WeeklySkeleton />}>
      <WeeklyContent />
    </Suspense>
  );
}

async function WeeklyContent() {
  const t = await getTranslations("Goals");
  const user = await getCurrentUser();
  const locale = (await getLocale()) as "en" | "da";

  const [{ units }, goal] = await Promise.all([
    getPreferences(user, locale),
    getWeeklyGoal(user).catch((error): WeeklyGoal | null | "unavailable" => {
      console.error("[weekly goal] unavailable", error);
      return "unavailable";
    }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("weekly.intro")}</p>
        <div className="pt-2">
          <GoalsTabs base="/goals" />
        </div>
      </div>
      {goal === "unavailable" ? (
        <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
          {t("unavailable")}
        </p>
      ) : (
        <WeeklyGoalForm goal={goal} units={units} />
      )}
    </div>
  );
}

function WeeklySkeleton() {
  const t = useTranslations("Goals");
  return <PageSkeleton layout="calculator" label={t("loading")} />;
}
