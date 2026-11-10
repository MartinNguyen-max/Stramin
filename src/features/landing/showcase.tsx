import { connection } from "next/server";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { CalendarShell } from "@/features/calendar/components/calendar-shell";
import { MobileCalendar } from "@/features/calendar/components/mobile-calendar";
import { TrainingCalendar } from "@/features/calendar/components/training-calendar";
import { loadDemoActivities } from "@/features/demo/demo-activities";
import { DEMO_GOALS, demoBestEfforts } from "@/features/demo/demo-efforts";
import { demoEvents } from "@/features/demo/demo-events";
import { EventsStrip } from "@/features/events/components/events-strip";
import { GoalCard } from "@/features/goals/components/goal-card";
import { weeklyMetersBySport } from "@/features/goals/feedback";
import { PowerCard } from "@/features/profile/components/power-card";
import { RunningLevel } from "@/features/profile/components/running-level";
import { WorkoutCard } from "@/features/training/components/workout-card";
import { personalPaces } from "@/features/training/plan";
import { WORKOUTS } from "@/features/training/workouts";
import {
  buildCalendar,
  resolvePeriod,
  visibleRange,
} from "@/lib/analytics/calendar";
import { today } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * The landing page shows the real app with example data (owner feedback L1): the same components as
 * the logged-in pages, read-only. Rendered per request, since the example is built around today.
 */

async function demoMonth() {
  await connection();
  const serverToday = today();
  const period = resolvePeriod({ view: "1m" }, serverToday);
  const activities = await loadDemoActivities(visibleRange(period, "monday"));
  return {
    serverToday,
    calendar: buildCalendar(activities, period, "monday", serverToday),
  };
}

/** The phone in the hero: the real phone calendar with this month's example training. */
export async function HeroPhone() {
  const { calendar } = await demoMonth();
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[2.25rem] border-[6px] border-foreground/85 bg-background p-2 shadow-2xl">
      <div className="pointer-events-none max-h-[560px] overflow-hidden rounded-[1.6rem]">
        <MobileCalendar
          weeks={calendar.weeks}
          units="metric"
          multiMonth={false}
        />
      </div>
    </div>
  );
}

/** All the example sections below the hero. */
export async function Showcase() {
  const { serverToday, calendar } = await demoMonth();
  const { efforts, activities, power } = await demoBestEfforts();
  const paces = personalPaces(efforts);
  const workouts = ["intervals-400", "cruise-intervals", "bike-ftp-2x20"]
    .map((id) => WORKOUTS.find((workout) => workout.id === id))
    .filter((workout) => workout !== undefined);
  const goal = DEMO_GOALS[0];

  return (
    <>
      <Section name="calendar" wide>
        <Frame>
          <CalendarShell base="/demo" toolbar={null}>
            <TrainingCalendar calendar={calendar} units="metric" />
          </CalendarShell>
        </Frame>
      </Section>

      <Section name="events">
        <EventsStrip
          events={demoEvents(serverToday)}
          serverToday={serverToday}
        />
      </Section>

      <Section name="level" wide>
        <div className="flex flex-col gap-4">
          <RunningLevel efforts={efforts} units="metric" />
          <PowerCard power={power} />
        </div>
      </Section>

      <Section name="training" wide>
        <div className="grid gap-4 md:grid-cols-3">
          {workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              paces={paces}
              units="metric"
            />
          ))}
        </div>
      </Section>

      <Section name="goals">
        <div className="max-w-xl">
          <GoalCard
            goal={goal}
            efforts={efforts}
            weeklyMeters={weeklyMetersBySport(
              activities,
              serverToday,
              "monday",
            )}
            units="metric"
            readOnly
            trainingBase="/demo/training"
          />
        </div>
      </Section>
    </>
  );
}

type SectionName = "calendar" | "events" | "level" | "training" | "goals";

function Section({
  name,
  wide = false,
  children,
}: {
  name: SectionName;
  wide?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("Landing.showcase");
  return (
    <section className="flex flex-col gap-6">
      <div className={cn("flex flex-col gap-2", !wide && "max-w-2xl")}>
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {t(`${name}.eyebrow`)}
        </span>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t(`${name}.title`)}
        </h2>
        <p className="max-w-2xl text-muted-foreground">{t(`${name}.text`)}</p>
      </div>
      {children}
    </section>
  );
}

/** A light "browser window" around a screen, with an "Example data" tag. */
function Frame({ children }: { children: ReactNode }) {
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
      <div className="pointer-events-none p-3 sm:p-4">{children}</div>
    </div>
  );
}
