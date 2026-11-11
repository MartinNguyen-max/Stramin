import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { getCurrentUser } from "@/features/auth/current-user";
import { Calculator } from "@/features/goals/components/calculator";
import { GoalsTabs } from "@/features/goals/components/goals-tabs";
import { goalDistanceLabels, plainBests } from "@/features/goals/form-data";
import { loadBestEfforts } from "@/features/profile/best-efforts-data";
import { getOrCreateProfile } from "@/features/profile/data";
import type { Units } from "@/lib/preferences";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Goals.tabs");
  return { title: `${t("calculator")} · Stramin` };
}

/** The pace calculator, a tab of Goals (owner feedback 2026-11-12). */
export default function CalculatorPage() {
  return (
    <Suspense fallback={<CalculatorSkeleton />}>
      <CalculatorContent />
    </Suspense>
  );
}

async function CalculatorContent() {
  const t = await getTranslations("Goals");
  const tDistances = await getTranslations("Distances");
  const user = await getCurrentUser();
  const locale = (await getLocale()) as "en" | "da";

  let units: Units = "metric";
  try {
    units = (await getOrCreateProfile(user, locale)).units;
  } catch (error) {
    console.error("[calculator] profile unavailable", error);
  }
  const { efforts } = await loadBestEfforts(user);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("calculator.intro")}</p>
        <div className="pt-2">
          <GoalsTabs base="/goals" />
        </div>
      </div>
      <Calculator
        bests={plainBests(efforts)}
        distanceLabels={goalDistanceLabels(locale, {
          halfMarathon: tDistances("halfMarathon"),
          marathon: tDistances("marathon"),
        })}
        units={units}
        goalsBase="/goals"
      />
    </div>
  );
}

function CalculatorSkeleton() {
  const t = useTranslations("Goals");
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <ZoneSpinner size={72} label={t("loading")} />
    </div>
  );
}
