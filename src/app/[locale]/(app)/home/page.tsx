import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { buttonVariants } from "@/components/ui/button";
import { AverageWeek } from "@/features/activities/components/average-week";
import {
  ThisWeek,
  WeeksChart,
} from "@/features/activities/components/week-overview";
import { loadStravaActivities } from "@/features/activities/strava-source";
import { getCurrentUser } from "@/features/auth/current-user";
import { getOrCreateProfile } from "@/features/profile/data";
import { Link } from "@/i18n/navigation";
import {
  AVERAGE_PERIODS,
  type AveragePeriod,
  averageWeek,
  lastWeeks,
  weeklyTotals,
} from "@/lib/analytics/weekly";
import type { Units, WeekStart } from "@/lib/preferences";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Home");
  return { title: `${t("title")} · Stramin` };
}

const WEEKS_SHOWN = 12;

/** Home (UI_SPEC §2). The session is read inside Suspense, so the page shell stays static. */
export default function HomePage({
  searchParams,
}: PageProps<"/[locale]/home">) {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeContent({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/home">["searchParams"];
}) {
  const t = await getTranslations("Home");
  const user = await getCurrentUser();
  const locale = (await getLocale()) as "en" | "da";

  // The profile holds units and week start. If the database is unavailable, fall back to defaults.
  let units: Units = "metric";
  let weekStart: WeekStart = "monday";
  try {
    const profile = await getOrCreateProfile(user, locale);
    units = profile.units;
    weekStart = profile.weekStart;
  } catch (error) {
    console.error("[home] profile unavailable", error);
  }

  const requested = (await searchParams).period;
  const period: AveragePeriod = AVERAGE_PERIODS.includes(
    requested as AveragePeriod,
  )
    ? (requested as AveragePeriod)
    : "6m";

  const activities = await loadStravaActivities();
  const today = new Date().toISOString();

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">
        {t("greeting", { email: user.email ?? "" })}
      </h1>

      {activities ? (
        <Overview
          weeks={weeklyTotals(activities, weekStart)}
          today={today}
          period={period}
          units={units}
          weekStart={weekStart}
        />
      ) : (
        <ConnectCard />
      )}
    </>
  );
}

function Overview({
  weeks,
  today,
  period,
  units,
  weekStart,
}: {
  weeks: ReturnType<typeof weeklyTotals>;
  today: string;
  period: AveragePeriod;
  units: Units;
  weekStart: WeekStart;
}) {
  const recent = lastWeeks(weeks, today, WEEKS_SHOWN, weekStart);
  return (
    <>
      <ThisWeek week={recent[0]} />
      <WeeksChart weeks={recent} />
      <AverageWeek
        average={averageWeek(weeks, today, period, weekStart)}
        period={period}
        units={units}
      />
    </>
  );
}

function ConnectCard() {
  const t = useTranslations("Home");
  return (
    <section className="flex flex-col items-start gap-4 rounded-2xl border bg-card p-6">
      <h2 className="text-lg font-semibold">{t("connect.title")}</h2>
      <p className="text-sm text-muted-foreground">{t("connect.text")}</p>
      <div className="flex flex-wrap gap-3">
        <a
          href="/api/strava/connect?next=/home"
          className={buttonVariants({ size: "lg" })}
        >
          {t("connect.strava")}
        </a>
        <Link
          href="/guide"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          {t("connect.garminGuide")}
        </Link>
      </div>
    </section>
  );
}

/** Shown while the session and the training data load. */
function HomeSkeleton() {
  const t = useTranslations("Home");
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <ZoneSpinner size={72} label={t("loading")} />
    </div>
  );
}
