import { describe, expect, test } from "vitest";
import type { BestEffort } from "@/lib/analytics/best-efforts";
import {
  averageWeeklyMeters,
  gapFor,
  goalFeedback,
  isTargetAllowed,
  speedCheck,
  suggestTargets,
  volumeCheck,
} from "./feedback";

function effort(distance: number, seconds: number): BestEffort {
  return { sport: "run", distance, seconds, date: null, source: "manual" };
}

describe("suggestTargets (GOAL-5)", () => {
  test("the owner's example: a 20:00 5 km suggests 19:35, 19:00 and 18:00", () => {
    expect(suggestTargets(20 * 60)).toEqual([1175, 1140, 1080]);
  });

  test("marathons round to whole minutes and stay faster than the best", () => {
    const targets = suggestTargets(3.5 * 3600);
    for (const target of targets) {
      expect(target % 60).toBe(0);
      expect(target).toBeLessThan(3.5 * 3600);
    }
  });

  test("slower targets are refused", () => {
    expect(isTargetAllowed(25 * 60, 20 * 60)).toBe(false);
    expect(isTargetAllowed(20 * 60, 20 * 60)).toBe(false);
    expect(isTargetAllowed(18 * 60, 20 * 60)).toBe(true);
    expect(isTargetAllowed(18 * 60, undefined)).toBe(true);
  });
});

describe("gapFor (GOAL-3)", () => {
  test("levels", () => {
    expect(gapFor(1200, 1180).level).toBe("achieved");
    expect(gapFor(1170, 1200).level).toBe("close");
    expect(gapFor(1140, 1200).level).toBe("season");
    const big = gapFor(1000, 1200);
    expect(big.level).toBe("big");
    expect(big.stepTarget).toBe(1150);
  });
});

describe("speedCheck (GOAL-6)", () => {
  test("10 km in 40:00 needs about 19:15 on 5 km", () => {
    const check = speedCheck("run", 10_000, 2400, [effort(5000, 1185)]);
    expect(check?.distance).toBe(5000);
    expect(check?.needed).toBeGreaterThan(1145);
    expect(check?.needed).toBeLessThan(1165);
    expect(check?.limiter).toBe("speed");
  });

  test("a fast enough 5 km means endurance is the limiter", () => {
    expect(speedCheck("run", 10_000, 2400, [effort(5000, 1120)])?.limiter).toBe(
      "endurance",
    );
  });

  test("no reference without a best, and none for 1 km or other sports", () => {
    expect(speedCheck("run", 10_000, 2400, [])?.limiter).toBeNull();
    expect(speedCheck("run", 1000, 200, [])).toBeNull();
    expect(speedCheck("bike", 40_000, 3600, [])).toBeNull();
  });
});

describe("volumeCheck", () => {
  test("80 % of the recommendation is enough", () => {
    expect(volumeCheck("run", 10_000, 25_000)?.enough).toBe(true);
    expect(volumeCheck("run", 10_000, 20_000)?.enough).toBe(false);
    expect(volumeCheck("run", 10_000, null)).toBeNull();
  });
});

describe("goalFeedback", () => {
  test("speed-limited with good volume suggests hard workouts", () => {
    const feedback = goalFeedback(
      { sport: "run", distance: 10_000, target: 2400 },
      [effort(5000, 1185), effort(10_000, 2460)],
      32_000,
    );
    expect(feedback.gap?.level).toBe("close");
    expect(feedback.efforts).toEqual(["hard"]);
  });

  test("low volume suggests easy workouts too", () => {
    const feedback = goalFeedback(
      { sport: "run", distance: 10_000, target: 2400 },
      [effort(5000, 1120), effort(10_000, 2490)],
      12_000,
    );
    expect(feedback.efforts).toEqual(["moderate", "easy"]);
  });

  test("achieved goals get no workouts", () => {
    const feedback = goalFeedback(
      { sport: "run", distance: 5000, target: 1300 },
      [effort(5000, 1200)],
      30_000,
    );
    expect(feedback.gap?.level).toBe("achieved");
    expect(feedback.efforts).toEqual([]);
  });
});

describe("averageWeeklyMeters", () => {
  test("averages the last 8 finished weeks, without the current week", () => {
    const activity = (date: string, meters: number) => ({
      id: date,
      name: "Run",
      sport: "run" as const,
      startLocal: `${date}T07:00:00Z`,
      movingSeconds: 3000,
      distanceMeters: meters,
      indoor: false,
    });
    const activities = [
      activity("2026-11-09", 99_000), // this week: not counted
      activity("2026-11-02", 10_000),
      activity("2026-09-14", 6000), // first counted week
      activity("2026-09-13", 50_000), // too old
    ];
    expect(averageWeeklyMeters(activities, "run", "2026-11-10", "monday")).toBe(
      2000,
    );
  });
});
