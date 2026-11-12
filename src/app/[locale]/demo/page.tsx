import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import {
  CalendarSection,
  readCalendarRequest,
} from "@/features/calendar/components/calendar-section";
import { loadDemoActivities } from "@/features/demo/demo-activities";
import { demoEvents } from "@/features/demo/demo-events";
import { DemoSpinner } from "@/features/demo/demo-spinner";
import { EventsStrip } from "@/features/events/components/events-strip";
import { today } from "@/lib/dates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Demo");
  return { title: `${t("title")} · Stramin` };
}

/**
 * Demo of Home with made-up training: the real calendar and event components without an account.
 * Also used for screenshots and end-to-end tests.
 */
export default function DemoHomePage({
  searchParams,
}: PageProps<"/[locale]/demo">) {
  return (
    <Suspense fallback={<DemoSpinner layout="home" />}>
      <DemoHome searchParams={searchParams} />
    </Suspense>
  );
}

async function DemoHome({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/demo">["searchParams"];
}) {
  const request = await readCalendarRequest(await searchParams);
  // Rendered per request: the demo is built around today's date.
  await connection();
  const serverToday = today();
  return (
    <>
      <EventsStrip events={demoEvents(serverToday)} serverToday={serverToday} />
      <CalendarSection
        base="/demo"
        request={request}
        units="metric"
        weekStart="monday"
        load={loadDemoActivities}
        notConnected={null}
      />
    </>
  );
}
