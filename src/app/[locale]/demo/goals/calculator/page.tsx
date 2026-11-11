import type { Metadata } from "next";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { demoBestEfforts } from "@/features/demo/demo-efforts";
import { DemoSpinner } from "@/features/demo/demo-spinner";
import { Calculator } from "@/features/goals/components/calculator";
import { GoalsTabs } from "@/features/goals/components/goals-tabs";
import { goalDistanceLabels, plainBests } from "@/features/goals/form-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Goals.tabs");
  return { title: `${t("calculator")} · Stramin` };
}

/** Demo of the pace calculator with the demo best efforts. */
export default function DemoCalculatorPage() {
  return (
    <Suspense fallback={<DemoSpinner />}>
      <DemoCalculator />
    </Suspense>
  );
}

async function DemoCalculator() {
  await connection();
  const t = await getTranslations("Goals");
  const tDistances = await getTranslations("Distances");
  const locale = await getLocale();
  const { efforts } = await demoBestEfforts();
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("calculator.intro")}</p>
        <div className="pt-2">
          <GoalsTabs base="/demo/goals" />
        </div>
      </div>
      <Calculator
        bests={plainBests(efforts)}
        distanceLabels={goalDistanceLabels(locale, {
          halfMarathon: tDistances("halfMarathon"),
          marathon: tDistances("marathon"),
        })}
        units="metric"
        goalsBase={null}
      />
    </div>
  );
}
