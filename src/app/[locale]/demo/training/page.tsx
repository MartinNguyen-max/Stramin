import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { demoBestEfforts } from "@/features/demo/demo-efforts";
import { DemoSpinner } from "@/features/demo/demo-spinner";
import {
  readTrainingParams,
  TrainingView,
} from "@/features/training/components/training-view";
import { personalPaces } from "@/features/training/plan";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Training");
  return { title: `${t("title")} · Stramin` };
}

/** Demo of the training inspiration, with paces from the demo history. Favorites need a login. */
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
  const params = readTrainingParams(await searchParams);
  await connection();
  const { efforts } = await demoBestEfforts();
  return (
    <TrainingView
      base="/demo/training"
      params={params}
      paces={personalPaces(efforts)}
      units="metric"
      favorites={null}
      favoritesNote="demo"
    />
  );
}
