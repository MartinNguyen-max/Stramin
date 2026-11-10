import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { DEMO_GOALS, demoBestEfforts } from "@/features/demo/demo-efforts";
import { DemoSpinner } from "@/features/demo/demo-spinner";
import { GoalCard } from "@/features/goals/components/goal-card";
import { averageWeeklyMeters } from "@/features/goals/feedback";
import { today } from "@/lib/dates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Goals");
  return { title: `${t("title")} · Stramin` };
}

/** Demo of goals with feedback, based on the demo history (read-only). */
export default function DemoGoalsPage() {
  return (
    <Suspense fallback={<DemoSpinner />}>
      <DemoGoals />
    </Suspense>
  );
}

async function DemoGoals() {
  await connection();
  const t = await getTranslations("Goals");
  const { efforts, activities } = await demoBestEfforts();
  const serverToday = today();
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_GOALS.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            efforts={efforts}
            metersPerWeek={averageWeeklyMeters(
              activities,
              goal.sport,
              serverToday,
              "monday",
            )}
            units="metric"
            readOnly
            trainingBase="/demo/training"
          />
        ))}
      </div>
    </div>
  );
}
