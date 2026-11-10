import { describe, expect, test } from "vitest";
import { bestPowerAcross, bestPowers } from "./power";

describe("bestPowers", () => {
  test("finds the best window, also with irregular samples", () => {
    // 10 minutes at 200 W, 20 minutes at 300 W, 10 minutes at 100 W, sampled every 2 s.
    const time: number[] = [];
    const watts: number[] = [];
    for (let t = 0; t <= 2400; t += 2) {
      time.push(t);
      watts.push(t < 600 ? 200 : t < 1800 ? 300 : 100);
    }
    const result = bestPowers(time, watts, [60, 1200, 3600]);
    expect(result["60"]).toBe(300);
    expect(result["1200"]).toBe(300);
    // Longer than the ride: no value.
    expect(result["3600"]).toBeUndefined();
  });

  test("a pause holds the last value until the next sample", () => {
    const result = bestPowers([0, 10, 70], [100, 400, 0], [60]);
    expect(result["60"]).toBe(400);
  });

  test("bad input gives nothing", () => {
    expect(bestPowers([], [])).toEqual({});
    expect(bestPowers([0, 1], [100])).toEqual({});
  });
});

describe("bestPowerAcross", () => {
  test("the best per duration over all rides", () => {
    const result = bestPowerAcross([
      {
        id: "a",
        startLocal: "2026-10-01T07:00:00Z",
        powerBests: { "60": 400, "1200": 280 },
      },
      {
        id: "b",
        startLocal: "2026-11-01T07:00:00Z",
        powerBests: { "60": 380, "1200": 290 },
      },
      { id: "c", startLocal: "2026-11-02T07:00:00Z", powerBests: null },
    ]);
    expect(result).toEqual([
      { duration: 60, watts: 400, activityId: "a", date: "2026-10-01" },
      { duration: 1200, watts: 290, activityId: "b", date: "2026-11-01" },
    ]);
  });
});
