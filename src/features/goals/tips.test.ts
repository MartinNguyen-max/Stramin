import { describe, expect, test } from "vitest";
import type { BestEffort } from "@/lib/analytics/best-efforts";
import type { CalendarActivity } from "@/lib/analytics/calendar";
import {
  goalTips,
  longSessionFor,
  nextVolume,
  type SportStats,
  type TrainingStats,
  targetVolume,
  trainingStats,
  triathlonTips,
} from "./tips";

// Thursday. The 12 finished weeks are 17 Aug – 8 Nov, the recent 4 are 12 Oct – 8 Nov.
const TODAY = "2026-11-12";

function run(date: string, km: number): CalendarActivity {
  return {
    id: date,
    name: "Run",
    sport: "run",
    startLocal: `${date}T07:00:00Z`,
    movingSeconds: km * 300,
    distanceMeters: km * 1000,
    indoor: false,
  };
}

function sport(partial: Partial<SportStats> = {}): SportStats {
  return {
    metersPerWeek: 0,
    recentMetersPerWeek: 0,
    sessionsPerWeek: 3,
    weeksTrained: 12,
    longest: 0,
    daysSinceLast: 1,
    ...partial,
  };
}

function stats(partial: Partial<TrainingStats> = {}): TrainingStats {
  return { run: sport(), bike: sport(), swim: sport(), ...partial };
}

const best = (distance: number, seconds: number): BestEffort => ({
  sport: "run",
  distance,
  seconds,
  date: null,
  source: "manual",
});

const keys = (tips: { key: string }[]) => tips.map((tip) => tip.key);

describe("trainingStats", () => {
  test("3 months of weeks, the recent 4, weeks trained, longest and the last session", () => {
    const result = trainingStats(
      [
        run("2026-09-01", 10),
        run("2026-09-03", 16),
        run("2026-10-20", 12),
        run("2026-11-10", 30), // this week: only "days since"
        run("2026-08-01", 40), // too old
      ],
      TODAY,
      "monday",
    );
    expect(result.run.metersPerWeek).toBe(38_000 / 12);
    expect(result.run.recentMetersPerWeek).toBe(12_000 / 4);
    expect(result.run.sessionsPerWeek).toBe(3 / 12);
    expect(result.run.weeksTrained).toBe(2);
    expect(result.run.longest).toBe(16_000);
    expect(result.run.daysSinceLast).toBe(2);
    expect(result.swim.daysSinceLast).toBeNull();
  });
});

describe("targetVolume", () => {
  test("a faster half asks for more weekly distance (the owner's 40 → 60 km)", () => {
    const fast = targetVolume("run", 21_098, 80 * 60);
    expect(fast).toBeGreaterThanOrEqual(60_000);
    expect(fast).toBeLessThanOrEqual(70_000);
    expect(targetVolume("run", 21_098, 105 * 60)).toBeLessThan(45_000);
    expect(targetVolume("run", 5000, 18 * 60 + 5)).toBeGreaterThan(30_000);
  });
});

describe("longSessionFor", () => {
  test("long runs for longer races only", () => {
    expect(longSessionFor("run", 5000)).toBeNull();
    expect(longSessionFor("run", 21_098)).toBe(18_000);
    expect(longSessionFor("bike", 180_000)).toBe(135_000);
    expect(longSessionFor("swim", 1900)).toBe(1900);
  });
});

describe("goalTips", () => {
  const half = { sport: "run" as const, distance: 21_098, target: 80 * 60 };
  const fiveK = { sport: "run" as const, distance: 5000, target: 18 * 60 };

  test("most relevant first: low volume, speed, a too short long run", () => {
    const tips = goalTips(
      half,
      [best(5000, 21 * 60), best(21_098, 92 * 60)],
      stats({ run: sport({ metersPerWeek: 30_000, longest: 10_000 }) }),
    );
    expect(keys(tips).slice(0, 3)).toEqual([
      "volume.run",
      "speedLimit",
      "longSession.run",
    ]);
  });

  test("two run goals get different tips", () => {
    const own = stats({
      run: sport({ metersPerWeek: 40_000, longest: 20_000 }),
    });
    const efforts = [best(5000, 19 * 60), best(21_098, 92 * 60)];
    const halfTips = keys(goalTips(half, efforts, own));
    const fiveTips = keys(goalTips(fiveK, efforts, own));
    expect(halfTips).toContain("workoutHalf");
    expect(fiveTips).toContain("workout5k");
    expect(halfTips.slice(0, 3)).not.toEqual(fiveTips.slice(0, 3));
  });

  test("a long break comes first", () => {
    const tips = goalTips(
      fiveK,
      [best(5000, 19 * 60)],
      stats({ run: sport({ metersPerWeek: 30_000, daysSinceLast: 20 }) }),
    );
    expect(tips[0].key).toBe("comeback.run");
  });

  test("each tip once, nothing when the goal is reached", () => {
    const tips = goalTips(half, [best(21_098, 92 * 60)], null);
    expect(new Set(keys(tips)).size).toBe(tips.length);
    expect(goalTips(half, [best(21_098, 79 * 60)], null)).toEqual([]);
  });
});

describe("triathlonTips", () => {
  test("Ironman: only a volume line per discipline that trains too little, in race order", () => {
    const tips = triathlonTips(
      "full",
      stats({
        swim: sport({ metersPerWeek: 3000 }),
        bike: sport({ metersPerWeek: 200_000 }),
        run: sport({ metersPerWeek: 20_000 }),
      }),
    );
    expect(keys(tips)).toEqual(["volume.swim", "volume.run"]);
    // A step of about 20 %, not the full target at once.
    expect(tips[0].values?.target).toMatchObject({ meters: 3600 });
    expect(tips[1].values?.target).toMatchObject({ meters: 24_000 });
  });

  test("no tips without Strava data", () => {
    expect(triathlonTips("half", null)).toEqual([]);
  });
});

describe("nextVolume", () => {
  test("about 20 % more, at least 40 % of the target, at most the target", () => {
    expect(nextVolume(10_000, 40_000)).toBe(16_000);
    expect(nextVolume(30_000, 40_000)).toBe(36_000);
    expect(nextVolume(33_000, 40_000)).toBe(39_600);
    expect(nextVolume(34_000, 40_000)).toBeNull();
    expect(nextVolume(0, 6000)).toBe(2400);
  });
});
