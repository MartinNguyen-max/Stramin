import { describe, expect, test } from "vitest";
import {
  distanceKey,
  type EffortActivity,
  estimateBestEfforts,
  findEffort,
  isEffortDistance,
  mergeBestEfforts,
} from "./best-efforts";

function run(
  id: string,
  meters: number,
  seconds: number,
  date = "2026-10-01",
  elapsed = seconds,
): EffortActivity {
  return {
    id,
    name: "Run",
    sport: "run",
    startLocal: `${date}T07:00:00Z`,
    movingSeconds: seconds,
    elapsedSeconds: elapsed,
    distanceMeters: meters,
    indoor: false,
  };
}

describe("estimateBestEfforts", () => {
  test("uses the best average pace of activities at least as long as the distance", () => {
    const efforts = estimateBestEfforts([
      run("race", 4960, 1180), // a 5 km race measured as 4.96 km
      run("long", 12_000, 3000), // 4:10/km → 5 km in 20:50
      run("short", 3000, 600), // too short for 5 km
    ]);
    const fiveK = findEffort(efforts, "run", 5000);
    expect(fiveK?.activityId).toBe("race");
    expect(fiveK?.seconds).toBeCloseTo((1180 / 4960) * 5000, 6);
    // 10 km only from the 12 km run.
    expect(findEffort(efforts, "run", 10_000)?.seconds).toBeCloseTo(2500, 6);
    // No marathon.
    expect(findEffort(efforts, "run", 42_195)).toBeUndefined();
  });

  test("ignores activities without distance and other sports", () => {
    expect(
      estimateBestEfforts([
        { ...run("x", 0, 600) },
        { ...run("y", 6000, 1500), sport: "strength" },
      ]),
    ).toEqual([]);
  });
});

describe("mergeBestEfforts", () => {
  test("manual values win, the estimate is kept for reference", () => {
    const estimates = estimateBestEfforts([run("a", 10_000, 2500)]);
    const merged = mergeBestEfforts(estimates, [
      { sport: "run", distance: 5000, seconds: 1150, date: "2025-05-01" },
    ]);
    const fiveK = findEffort(merged, "run", 5000);
    expect(fiveK).toMatchObject({ source: "manual", seconds: 1150 });
    expect(fiveK?.estimate?.activityId).toBe("a");
    expect(findEffort(merged, "run", 10_000)).toMatchObject({
      source: "strava",
      activityId: "a",
    });
  });

  test("the half marathon has an integer key", () => {
    expect(distanceKey(21_097.5)).toBe(21_098);
    expect(isEffortDistance("run", 21_098)).toBe(true);
    expect(isEffortDistance("run", 3000)).toBe(false);
  });
});

describe("pauses and Strava's own best efforts (owner feedback P1, P2)", () => {
  test("a pause inside a run counts, like on Strava", () => {
    // 5 km: 18 min running, 10 min paused.
    const efforts = estimateBestEfforts([
      run("paused", 5000, 18 * 60, "2026-10-01", 28 * 60),
    ]);
    expect(findEffort(efforts, "run", 5000)?.seconds).toBe(28 * 60);
  });

  test("Strava's exact best effort wins over the average-pace estimate", () => {
    const efforts = estimateBestEfforts([
      {
        ...run("long", 12_000, 3000),
        exactEfforts: [
          { distance: 5000, seconds: 1180 },
          { distance: 10_000, seconds: 2460 },
        ],
      },
      run("other", 5100, 1260),
    ]);
    expect(findEffort(efforts, "run", 5000)).toMatchObject({
      seconds: 1180,
      activityId: "long",
      exact: true,
    });
    expect(findEffort(efforts, "run", 1000)?.exact).toBe(false);
  });
});

describe("detail candidates", () => {
  test("the fastest few runs per distance", async () => {
    const { runDetailCandidates } = await import("./best-efforts");
    const runs = [
      run("slow", 10_000, 3600),
      run("fast", 10_000, 2400),
      run("short", 1200, 240),
    ];
    const ids = runDetailCandidates(runs, 1);
    expect(ids).toContain("fast");
    expect(ids).toContain("short");
    expect(ids).not.toContain("slow");
  });

  test("rides with a power meter, highest power first", async () => {
    const { rideDetailCandidates } = await import("./best-efforts");
    const ids = rideDetailCandidates(
      [
        {
          id: "a",
          deviceWatts: true,
          movingSeconds: 3600,
          avgWatts: 200,
          weightedAvgWatts: 230,
        },
        {
          id: "b",
          deviceWatts: true,
          movingSeconds: 3600,
          avgWatts: 250,
          weightedAvgWatts: null,
        },
        {
          id: "c",
          deviceWatts: false,
          movingSeconds: 3600,
          avgWatts: 300,
          weightedAvgWatts: 300,
        },
        {
          id: "d",
          deviceWatts: true,
          movingSeconds: 600,
          avgWatts: 400,
          weightedAvgWatts: 400,
        },
      ],
      2,
    );
    expect(ids).toEqual(["b", "a"]);
  });
});
