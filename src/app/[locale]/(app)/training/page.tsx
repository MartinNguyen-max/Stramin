import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import { getCurrentUser } from "@/features/auth/current-user";
import { loadBestEfforts } from "@/features/profile/best-efforts-data";
import { getPreferences } from "@/features/profile/data";
import {
  readTrainingParams,
  TrainingView,
} from "@/features/training/components/training-view";
import { listFavoriteIds } from "@/features/training/favorites-data";
import { personalPaces } from "@/features/training/plan";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Training");
  return { title: `${t("title")} · Stramin` };
}

/** Training inspiration (UI_SPEC §5): classics, the workout builder and favorites, with personal paces. */
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
  const params = readTrainingParams(await searchParams);

  const [{ units }, { efforts, power }, favorites] = await Promise.all([
    getPreferences(user, locale),
    loadBestEfforts(user),
    listFavoriteIds(user).catch((error) => {
      // E.g. before the favorites migration is applied: the rest of the page still works.
      console.error("[training] favorites unavailable", error);
      return null;
    }),
  ]);

  return (
    <TrainingView
      base="/training"
      params={params}
      paces={personalPaces(efforts, power)}
      units={units}
      favorites={favorites}
      favoritesNote="unavailable"
    />
  );
}

function TrainingSkeleton() {
  const t = useTranslations("Calendar");
  return <PageSkeleton layout="training" label={t("loading")} />;
}
