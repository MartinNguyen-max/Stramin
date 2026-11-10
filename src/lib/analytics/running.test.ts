import { describe, expect, test } from "vitest";
import {
  bestVdot,
  equivalentTime,
  oxygenCost,
  riegel,
  speedAtVo2,
  strongestRiegelEffort,
  trainingPaces,
  vdot,
} from "./running";

describe("VDOT (checked against Daniels' tables)", () => {
  test("a 19:57 5 km is about VDOT 50", () => {
    expect(vdot(5000, 19 * 60 + 57)).toBeCloseTo(50, 0);
  });

  test("race equivalents for VDOT 50", () => {
    // Daniels: 10 km 41:21, half 1:31:35, marathon 3:10:49 (±1 %).
    expect(equivalentTime(50, 10_000)).toBeGreaterThan(2481 * 0.99);
    expect(equivalentTime(50, 10_000)).toBeLessThan(2481 * 1.01);
    expect(equivalentTime(50, 21_097.5)).toBeGreaterThan(5495 * 0.99);
    expect(equivalentTime(50, 21_097.5)).toBeLessThan(5495 * 1.01);
    expect(equivalentTime(50, 42_195)).toBeGreaterThan(11_449 * 0.99);
    expect(equivalentTime(50, 42_195)).toBeLessThan(11_449 * 1.01);
  });

  test("the owner's example: 10 km in 40:00 needs a 5 km of about 19:15", () => {
    const level = vdot(10_000, 40 * 60);
    const fiveK = equivalentTime(level, 5000);
    expect(fiveK).toBeGreaterThan(19 * 60 + 5);
    expect(fiveK).toBeLessThan(19 * 60 + 25);
  });

  test("equivalentTime inverts vdot", () => {
    expect(equivalentTime(vdot(5000, 1200), 5000)).toBeCloseTo(1200, 0);
  });

  test("speedAtVo2 inverts oxygenCost", () => {
    expect(oxygenCost(speedAtVo2(45))).toBeCloseTo(45, 6);
  });
});

describe("trainingPaces", () => {
  test("VDOT 50: threshold ≈ 4:15/km, interval ≈ 3:55/km, repetition ≈ 3:41/km", () => {
    const paces = trainingPaces(50);
    expect(paces.threshold).toBeGreaterThan(250);
    expect(paces.threshold).toBeLessThan(260);
    expect(paces.interval).toBeGreaterThan(230);
    expect(paces.interval).toBeLessThan(240);
    expect(paces.repetition).toBeGreaterThan(216);
    expect(paces.repetition).toBeLessThan(226);
    // Easy is a range, slower than marathon pace.
    expect(paces.easy[0]).toBeGreaterThan(paces.easy[1]);
    expect(paces.easy[1]).toBeGreaterThan(paces.marathon);
    expect(paces.marathon).toBeGreaterThan(paces.threshold);
  });
});

describe("bestVdot", () => {
  test("takes the strongest effort and skips short ones", () => {
    const best = bestVdot([
      { distance: 1000, seconds: 150 },
      { distance: 5000, seconds: 1200 },
      { distance: 10_000, seconds: 2400 },
    ]);
    expect(best?.distance).toBe(10_000);
    expect(bestVdot([])).toBeNull();
  });
});

describe("riegel", () => {
  test("doubling the distance takes a bit more than twice the time", () => {
    expect(riegel(1200, 5000, 10_000)).toBeCloseTo(1200 * 2 ** 1.06, 6);
  });

  test("the strongest effort predicts the fastest times", () => {
    const weak40 = { distance: 40_000, seconds: 80 * 60 };
    const strong90 = { distance: 90_000, seconds: 150 * 60 };
    expect(strongestRiegelEffort([weak40, strong90])).toBe(strong90);
    expect(riegel(150 * 60, 90_000, 40_000)).toBeLessThan(80 * 60);
    expect(strongestRiegelEffort([])).toBeNull();
  });
});
