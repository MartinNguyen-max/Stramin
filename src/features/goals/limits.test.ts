import { describe, expect, test } from "vitest";
import { isWithinLimits, timeLimits } from "./limits";

describe("timeLimits", () => {
  test("5 km: from just under the world record to 10:00 /km", () => {
    expect(timeLimits("run", 5000)).toEqual({ min: 750, max: 3000 });
    expect(isWithinLimits("run", 5000, 10 * 60)).toBe(false);
    expect(isWithinLimits("run", 5000, 60 * 60)).toBe(false);
    expect(isWithinLimits("run", 5000, 18 * 60 + 5)).toBe(true);
  });

  test("the half marathon is found by its stored distance", () => {
    expect(timeLimits("run", 21_098).min).toBe(3420);
    expect(timeLimits("run", 21_097.5).min).toBe(3420);
  });

  test("bike 15–55 km/h, swim 0:55–4:00 /100 m", () => {
    expect(timeLimits("bike", 90_000)).toEqual({ min: 5890, max: 21_600 });
    expect(timeLimits("swim", 1900)).toEqual({ min: 1045, max: 4560 });
  });
});
