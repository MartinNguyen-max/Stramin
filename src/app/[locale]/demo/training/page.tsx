import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { demoBestEfforts } from "@/features/demo/demo-efforts";
import { DemoSpinner } from "@/features/demo/demo-spinner";
import {
  readTrainingFilters,
  TrainingView,
} from "@/features/training/components/training-view";
import { personalPaces } from "@/features/training/plan";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Training");
  return { title: `${t("title")} · Stramin` };
}

/** Demo of the training catalog, with paces from the demo history. */
export default function DemoTrainingPage({
  searchParams,
}: PageProps<"/[locale]/demo/training">) {
  return (
    <Suspense fallback={<DemoSpinner />}>
      <DemoTraining searchParams={searchParams} />
    </Suspense>
  );
}

async function DemoTraining({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/demo/training">["searchParams"];
}) {
  const { sport, effort } = readTrainingFilters(await searchParams);
  await connection();
  const { efforts } = await demoBestEfforts();
  return (
    <TrainingView
      base="/demo/training"
      sport={sport}
      effort={effort}
      paces={personalPaces(efforts)}
      units="metric"
    />
  );
}
