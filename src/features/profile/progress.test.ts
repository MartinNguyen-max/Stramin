import { describe, expect, test } from "vitest";
import type { EffortActivity } from "@/lib/analytics/best-efforts";
import { ownEfforts, progressOver } from "./progress";

const TODAY = "2026-11-12";

function run(date: string, km: number, minutes: number): EffortActivity {
  return {
    id: date,
    name: "Run",
    sport: "run",
    startLocal: `${date}T07:00:00Z`,
    movingSeconds: minutes * 60,
    elapsedSeconds: minutes * 60,
    distanceMeters: km * 1000,
    indoor: false,
  };
}

describe("progressOver", () => {
  const activities = [
    // Six months ago and before: a slower 5 km, little running.
    run("2026-04-20", 5, 25),
    run("2026-05-01", 10, 55),
    // Lately: a faster 5 km and more running.
    run("2026-10-10", 5, 21),
    run("2026-10-20", 12, 60),
    run("2026-11-01", 15, 75),
  ];

  test("best efforts back then and now", () => {
    const progress = progressOver(activities, TODAY, 6);
    expect(progress.since).toBe("2026-05-12");
    const fiveK = progress.efforts.find(
      (effort) => effort.sport === "run" && effort.distance === 5000,
    );
    expect(fiveK?.before).toBe(25 * 60);
    expect(fiveK?.now).toBe(21 * 60);
  });

  test("weekly training over the 12 weeks before each moment", () => {
    const progress = progressOver(activities, TODAY, 6);
    expect(progress.volume.run.before.meters).toBeCloseTo(15_000 / 12);
    expect(progress.volume.run.now.meters).toBeCloseTo(32_000 / 12);
    expect(progress.hours.now).toBeGreaterThan(progress.hours.before);
  });

  test("a best that's new since then has no 'before'", () => {
    const progress = progressOver(activities, TODAY, 6);
    const tenK = progress.efforts.find((effort) => effort.distance === 10_000);
    expect(tenK?.before).toBe(55 * 60);
    const longer = progressOver([run("2026-11-01", 21.1, 110)], TODAY, 3);
    expect(longer.efforts.every((effort) => effort.before === undefined)).toBe(
      true,
    );
  });
  test("the user's own values count as now, and as then when dated before the day", () => {
    const own = [
      {
        sport: "run" as const,
        distance: 5000,
        seconds: 20 * 60,
        date: "2026-04-01",
      },
      {
        sport: "run" as const,
        distance: 10_000,
        seconds: 50 * 60,
        date: "2026-11-05",
      },
      {
        sport: "run" as const,
        distance: 21_098,
        seconds: 100 * 60,
        date: null,
      },
    ];
    const progress = progressOver(activities, TODAY, 6, own);
    const fiveK = progress.efforts.find((effort) => effort.distance === 5000);
    expect(fiveK?.before).toBe(20 * 60);
    expect(fiveK?.now).toBe(20 * 60);
    const tenK = progress.efforts.find((effort) => effort.distance === 10_000);
    expect(tenK?.before).toBe(55 * 60);
    expect(tenK?.now).toBe(50 * 60);
    const half = progress.efforts.find(
      (effort) => effort.distance === 21_097.5,
    );
    expect(half?.before).toBeUndefined();
    expect(half?.now).toBe(100 * 60);
  });

  test("ownEfforts keeps only the manual values of a merged list", () => {
    const own = ownEfforts([
      {
        sport: "run",
        distance: 5000,
        seconds: 1200,
        date: "2026-04-01",
        source: "manual",
      },
      {
        sport: "run",
        distance: 10_000,
        seconds: 3000,
        date: null,
        source: "strava",
      },
    ]);
    expect(own).toEqual([
      { sport: "run", distance: 5000, seconds: 1200, date: "2026-04-01" },
    ]);
  });
});
