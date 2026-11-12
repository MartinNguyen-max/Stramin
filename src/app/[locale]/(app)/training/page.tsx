import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { getCurrentUser } from "@/features/auth/current-user";
import { loadBestEfforts } from "@/features/profile/best-efforts-data";
import { getPreferences } from "@/features/profile/data";
import {
  readTrainingFilters,
  TrainingView,
} from "@/features/training/components/training-view";
import { personalPaces } from "@/features/training/plan";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Training");
  return { title: `${t("title")} · Stramin` };
}

/** Training inspiration (UI_SPEC §5): the catalog with personal paces. */
export default function TrainingPage({
  searchParams,
}: PageProps<"/[locale]/training">) {
  return (
    <Suspense fallback={<TrainingSkeleton />}>
      <TrainingContent searchParams={searchParams} />
    </Suspense>
  );
}

async function TrainingContent({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/training">["searchParams"];
}) {
  const user = await getCurrentUser();
  const locale = (await getLocale()) as "en" | "da";
  const { sport, effort } = readTrainingFilters(await searchParams);

  const [{ units }, { efforts }] = await Promise.all([
    getPreferences(user, locale),
    loadBestEfforts(user),
  ]);

  return (
    <TrainingView
      base="/training"
      sport={sport}
      effort={effort}
      paces={personalPaces(efforts)}
      units={units}
    />
  );
}

function TrainingSkeleton() {
  const t = useTranslations("Calendar");
  return <PageSkeleton layout="training" label={t("loading")} />;
}
