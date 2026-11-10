import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { demoBestEfforts } from "@/features/demo/demo-efforts";
import { DemoSpinner } from "@/features/demo/demo-spinner";
import { BestEffortsCard } from "@/features/profile/components/best-efforts-card";
import { PowerCard } from "@/features/profile/components/power-card";
import { PredictionsCard } from "@/features/profile/components/predictions-card";
import { RunningLevel } from "@/features/profile/components/running-level";
import { EFFORT_SPORTS } from "@/lib/analytics/best-efforts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Profile");
  return { title: `${t("title")} · Stramin` };
}

/** Demo of the profile: best efforts from the demo history (read-only) and the running level. */
export default function DemoProfilePage() {
  return (
    <Suspense fallback={<DemoSpinner />}>
      <DemoProfile />
    </Suspense>
  );
}

async function DemoProfile() {
  await connection();
  const t = await getTranslations("Profile");
  const { efforts, power } = await demoBestEfforts();
  return (
    <>
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("bestEfforts.title")}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t("bestEfforts.note")}
        </p>
        <div className="grid gap-4 lg:grid-cols-3">
          {EFFORT_SPORTS.map((sport) => (
            <BestEffortsCard
              key={sport}
              sport={sport}
              efforts={efforts}
              units="metric"
              editable={false}
            />
          ))}
        </div>
      </section>
      <PowerCard power={power} />
      <RunningLevel efforts={efforts} units="metric" />
      <PredictionsCard efforts={efforts} units="metric" />
    </>
  );
}
