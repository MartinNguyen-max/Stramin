import { describe, expect, test } from "vitest";
import type { BestEffort } from "@/lib/analytics/best-efforts";
import {
  maxZone,
  personalPaces,
  stepPace,
  stepSeconds,
  workoutSeconds,
} from "./plan";
import { WORKOUTS } from "./workouts";

const efforts: BestEffort[] = [
  {
    sport: "run",
    distance: 5000,
    seconds: 19 * 60 + 57,
    date: null,
    source: "manual",
  },
  {
    sport: "swim",
    distance: 1000,
    seconds: 1200,
    date: null,
    source: "manual",
  },
];

describe("personalPaces", () => {
  test("running paces from the best VDOT, swim pace from the 1 km", () => {
    const paces = personalPaces(efforts);
    expect(paces.runBasis?.level).toBeCloseTo(50, 0);
    expect(paces.swimPer100).toBe(120);
  });

  test("nothing without best efforts", () => {
    const paces = personalPaces([]);
    expect(paces.run).toBeNull();
    expect(paces.swimPer100).toBeNull();
  });
});

describe("steps", () => {
  const paces = personalPaces(efforts);

  test("12 × 400 m at repetition pace for VDOT 50: about 1:28 per 400 m", () => {
    const seconds = stepSeconds(
      "run",
      { meters: 400 },
      { pace: "repetition" },
      paces,
    );
    expect(seconds).toBeGreaterThan(86);
    expect(seconds).toBeLessThan(91);
  });

  test("swim zones add to the base pace", () => {
    expect(stepPace("swim", { zone: 4 }, paces)).toBe(123);
    expect(stepPace("swim", { zone: 2 }, paces)).toBe(135);
  });

  test("bike steps have no pace", () => {
    expect(stepPace("bike", { zone: 2 }, paces)).toBeNull();
  });
});

describe("workouts", () => {
  test("every workout has a sensible duration and its zone", () => {
    const paces = personalPaces([]);
    for (const workout of WORKOUTS) {
      const seconds = workoutSeconds(workout, paces);
      expect(seconds, workout.id).toBeGreaterThan(15 * 60);
      expect(seconds, workout.id).toBeLessThan(3 * 3600);
    }
    const intervals = WORKOUTS.find((w) => w.id === "intervals-400");
    expect(intervals && maxZone(intervals)).toBe(5);
  });

  test("ids are unique", () => {
    const ids = WORKOUTS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
