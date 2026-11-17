import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DEMO_WEEKLY_GOAL } from "@/features/demo/demo-efforts";
import { GoalsTabs } from "@/features/goals/components/goals-tabs";
import { WeeklyGoalForm } from "@/features/goals/components/weekly-goal-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Goals.tabs");
  return { title: `${t("weekly")} · Stramin` };
}

/** Demo of the weekly goal: the demo's example goal, read-only. */
export default async function DemoWeeklyGoalPage() {
  const t = await getTranslations("Goals");
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("weekly.intro")}</p>
        <div className="pt-2">
          <GoalsTabs base="/demo/goals" />
        </div>
      </div>
      <WeeklyGoalForm goal={DEMO_WEEKLY_GOAL} units="metric" readOnly />
    </div>
  );
}
