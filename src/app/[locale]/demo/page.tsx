import type { Metadata } from "next";
import { connection } from "next/server";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import {
  CalendarSection,
  readCalendarRequest,
} from "@/features/calendar/components/calendar-section";
import { loadDemoActivities } from "@/features/demo/demo-activities";
import { demoEvents } from "@/features/demo/demo-events";
import { EventsStrip } from "@/features/events/components/events-strip";
import { Link } from "@/i18n/navigation";
import { today } from "@/lib/dates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Demo");
  return { title: `${t("title")} · Stramin` };
}

/**
 * Public demo of Home with made-up training (UI_SPEC screen map). Shows the real calendar and event
 * components without an account, and is used for screenshots and end-to-end tests.
 */
export default function DemoPage({
  searchParams,
}: PageProps<"/[locale]/demo">) {
  const t = useTranslations("Demo");
  return (
    <>
      <SiteHeader wide />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pt-4 pb-20 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
          <p className="text-sm">
            <span className="font-semibold">{t("title")}.</span>{" "}
            <span className="text-muted-foreground">{t("text")}</span>
          </p>
          <Link href="/signup" className={buttonVariants({ size: "sm" })}>
            {t("signup")}
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="flex justify-center py-24">
              <ZoneSpinner size={72} label={t("loading")} />
            </div>
          }
        >
          <DemoContent searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter wide />
    </>
  );
}

async function DemoContent({
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
