import { connection } from "next/server";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { CalendarShell } from "@/features/calendar/components/calendar-shell";
import { MobileCalendar } from "@/features/calendar/components/mobile-calendar";
import { TrainingCalendar } from "@/features/calendar/components/training-calendar";
import { loadDemoActivities } from "@/features/demo/demo-activities";
import { demoEvents } from "@/features/demo/demo-events";
import { EventsStrip } from "@/features/events/components/events-strip";
import {
  buildCalendar,
  resolvePeriod,
  visibleRange,
} from "@/lib/analytics/calendar";
import { today } from "@/lib/dates";

/**
 * The landing page shows the real Home page with example data (owner feedback 2026-11-12: "short;
 * just the home page, then a video"): the greeting, the countdown cards, the average week and the
 * calendar, in a browser window on PC and in a phone. Rendered per request (built around today).
 */

async function demoHome() {
  await connection();
  const serverToday = today();
  const period = resolvePeriod({ view: "1m" }, serverToday);
  const activities = await loadDemoActivities(visibleRange(period, "monday"));
  return {
    serverToday,
    calendar: buildCalendar(activities, period, "monday", serverToday),
    events: demoEvents(serverToday),
  };
}

/** The hero: Home on PC (browser window) with the phone in front; on phones only the phone. */
export async function HeroDevices() {
  const { serverToday, calendar, events } = await demoHome();
  return (
    <div className="relative min-w-0 lg:pr-10 lg:pb-16">
      <div className="hidden lg:block">
        <Browser>
          {/* The full desktop Home, scaled down to fit the hero. */}
          <div className="h-[420px] overflow-hidden">
            <div className="flex w-[1120px] origin-top-left scale-[0.52] flex-col gap-5 p-6">
              <Greeting />
              <EventsStrip events={events} serverToday={serverToday} />
              <CalendarShell base="/demo" toolbar={null}>
                <TrainingCalendar calendar={calendar} units="metric" />
              </CalendarShell>
            </div>
          </div>
        </Browser>
      </div>
      <div className="mx-auto w-[240px] lg:absolute lg:right-0 lg:-bottom-2 lg:w-[210px] xl:-right-6">
        <Phone height={430}>
          <div className="flex w-[360px] origin-top-left scale-[0.585] flex-col gap-3 p-3 lg:scale-[0.515]">
            <Greeting />
            <EventsStrip events={events} serverToday={serverToday} />
            <MobileCalendar
              weeks={calendar.weeks}
              units="metric"
              multiMonth={false}
            />
          </div>
        </Phone>
      </div>
    </div>
  );
}

/**
 * A short video of the app (owner feedback 2026-11-12, L2). Plays the voiced MP4 when it's there,
 * else the silent screen recording (the browser tries the sources in order).
 */
export function LandingVideo() {
  const t = useTranslations("Landing.video");
  return (
    <section className="flex flex-col items-center gap-5">
      <div className="flex max-w-2xl flex-col items-center gap-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h2>
        <p className="text-muted-foreground">{t("text")}</p>
      </div>
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border bg-black shadow-xl">
        {/* biome-ignore lint/a11y/useMediaCaption: a voice-over; the same content is on the page and in the demo. */}
        <video
          controls
          playsInline
          preload="metadata"
          poster="/video/stramin-poster.png"
          className="aspect-video w-full"
        >
          <source src="/video/stramin.mp4" type="video/mp4" />
          <source src="/video/stramin.webm" type="video/webm" />
        </video>
      </div>
    </section>
  );
}

function Greeting() {
  const t = useTranslations("Landing.showcase");
  return (
    <h1 className="text-xl font-semibold tracking-tight">{t("greeting")}</h1>
  );
}

/** A light "browser window" around a screen, with an "Example data" tag. */
function Browser({ children }: { children: ReactNode }) {
  const t = useTranslations("Landing.showcase");
  return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-xl">
      <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-zone-5/70" />
        <span className="size-2.5 rounded-full bg-zone-3/70" />
        <span className="size-2.5 rounded-full bg-zone-2/70" />
        <span className="ml-3 text-xs text-muted-foreground">
          {t("sample")}
        </span>
      </div>
      <div className="pointer-events-none">{children}</div>
    </div>
  );
}

/** A phone frame around a phone screen. */
function Phone({ height, children }: { height: number; children: ReactNode }) {
  return (
    <div className="rounded-[2.25rem] border-[6px] border-foreground/85 bg-background p-1.5 shadow-2xl">
      <div
        className="pointer-events-none overflow-hidden rounded-[1.7rem]"
        style={{ height }}
      >
        {children}
      </div>
    </div>
  );
}
