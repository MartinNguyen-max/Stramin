import { cookies } from "next/headers";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import {
  isIndoorStrava,
  SPORTS,
  type Sport,
  sportFromStrava,
} from "@/lib/analytics/sports";
import { weeklyTotals } from "@/lib/analytics/weekly";
import { fetchAllActivities, STRAVA_TOKEN_COOKIE } from "@/lib/strava/client";
import { cn } from "@/lib/utils";

/**
 * SPIKE – Strava data test. Proves we can fetch the full history and compute weekly hours per sport.
 * Not translated and not designed. Replaced by the real Home and Activities screens.
 */

const SPORT_COLORS: Record<Sport, string> = {
  swim: "bg-zone-1",
  bike: "bg-zone-2",
  run: "bg-zone-5",
  strength: "bg-zone-3",
  other: "bg-muted-foreground/40",
};

function formatHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

export default function StravaTestPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-20 sm:px-6">
        <h1 className="text-2xl font-bold">Strava data test</h1>
        <Suspense
          fallback={<p className="mt-6">Loading your Strava history…</p>}
        >
          <StravaData />
        </Suspense>
      </main>
    </>
  );
}

async function StravaData() {
  const token = (await cookies()).get(STRAVA_TOKEN_COOKIE)?.value;

  if (!token) {
    return (
      <a
        href="/api/strava/connect?next=/strava-test"
        className={cn(buttonVariants({ size: "lg" }), "mt-6")}
      >
        Connect Strava
      </a>
    );
  }

  const raw = await fetchAllActivities(token);
  const activities = raw.map((a) => ({
    sport: sportFromStrava(a.sport_type),
    startLocal: a.start_date_local,
    durationSeconds: a.moving_time,
    indoor: isIndoorStrava(a.sport_type, a.trainer),
  }));
  const weeks = weeklyTotals(activities);
  const maxWeek = Math.max(1, ...weeks.map((w) => w.totalSeconds));
  const oldest = raw.at(-1)?.start_date_local.slice(0, 10);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <section className="rounded-2xl border bg-card p-5 text-sm">
        <p>
          <strong>{raw.length}</strong> activities fetched · oldest:{" "}
          <strong>{oldest ?? "–"}</strong> · <strong>{weeks.length}</strong>{" "}
          weeks with training ·{" "}
          <strong>{activities.filter((a) => a.indoor).length}</strong> indoor
        </p>
        <ul className="mt-3 flex flex-wrap gap-4">
          {SPORTS.map((sport) => (
            <li key={sport} className="flex items-center gap-2">
              <span
                className={cn("size-3 rounded-full", SPORT_COLORS[sport])}
              />
              {sport} ({activities.filter((a) => a.sport === sport).length})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Hours per week (newest first)</h2>
        <ul className="flex flex-col gap-1.5 text-sm">
          {weeks.map((week) => (
            <li
              key={week.weekStart}
              className="grid grid-cols-[6.5rem_3.5rem_1fr] items-center gap-3"
            >
              <span className="text-muted-foreground tabular-nums">
                {week.weekStart}
              </span>
              <span className="tabular-nums">
                {formatHours(week.totalSeconds)}
              </span>
              <span
                className="flex h-3 overflow-hidden rounded-full"
                style={{ width: `${(week.totalSeconds / maxWeek) * 100}%` }}
                title={SPORTS.map(
                  (s) => `${s} ${formatHours(week.seconds[s])}`,
                ).join(" · ")}
              >
                {SPORTS.map((sport) => (
                  <span
                    key={sport}
                    className={SPORT_COLORS[sport]}
                    style={{
                      width: `${(week.seconds[sport] / week.totalSeconds) * 100}%`,
                    }}
                  />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
