import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { ConnectCard } from "@/features/activities/components/connect-card";
import { loadStravaActivities } from "@/features/activities/strava-source";
import { getCurrentUser } from "@/features/auth/current-user";
import {
  CalendarSection,
  readCalendarRequest,
} from "@/features/calendar/components/calendar-section";
import { EventsSection } from "@/features/events/components/events-section";
import { getOrCreateProfile } from "@/features/profile/data";
import type { Units, WeekStart } from "@/lib/preferences";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Home");
  return { title: `${t("title")} · Stramin` };
}

/** Home (UI_SPEC §2): events at the top, then the training calendar. The session is read inside Suspense. */
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

  const request = await readCalendarRequest(await searchParams);

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">
        {t("greeting", { name: user.name ?? user.email ?? "" })}
      </h1>
      <EventsSection user={user} />
      <CalendarSection
        base="/home"
        request={request}
        units={units}
        weekStart={weekStart}
        load={loadStravaActivities}
        notConnected={<ConnectCard />}
      />
    </>
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
