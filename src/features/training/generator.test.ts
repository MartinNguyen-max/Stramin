import { describe, expect, it } from "vitest";
import { EFFORT_SPORTS } from "@/lib/analytics/best-efforts";
import {
  CREATE_EFFORTS,
  durationsFor,
  suggestWorkouts,
  workoutById,
} from "./generator";
import { DEFAULT_PACES, workoutSeconds } from "./plan";

const combos = EFFORT_SPORTS.flatMap((sport) =>
  durationsFor(sport).flatMap((minutes) =>
    CREATE_EFFORTS.map((effort) => ({ sport, minutes, effort })),
  ),
);

describe("durationsFor", () => {
  it("goes in 15 min steps to 2:30 h, then 30 min steps to 5:30 h", () => {
    expect(durationsFor("run")).toEqual([
      30, 45, 60, 75, 90, 105, 120, 135, 150, 180, 210, 240, 270, 300, 330,
    ]);
  });

  it("stops swims at 2 h", () => {
    expect(Math.max(...durationsFor("swim"))).toBe(120);
  });
});

describe("suggestWorkouts", () => {
  it("suggests 3 to 6 workouts for every sport, duration and effort", () => {
    for (const { sport, minutes, effort } of combos) {
      const count = suggestWorkouts(
        sport,
        minutes,
        effort,
        DEFAULT_PACES,
      ).length;
      expect(count, `${sport} ${minutes} ${effort}`).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(6);
    }
  });

  it("fills the chosen time (runs and rides within a minute)", () => {
    for (const { sport, minutes, effort } of combos) {
      if (sport === "swim") continue;
      for (const workout of suggestWorkouts(
        sport,
        minutes,
        effort,
        DEFAULT_PACES,
      )) {
        const seconds = workoutSeconds(workout, DEFAULT_PACES);
        expect(
          Math.abs(seconds - minutes * 60),
          workout.id,
        ).toBeLessThanOrEqual(60);
      }
    }
  });

  it("keeps swims close to the chosen time (meters are rounded)", () => {
    for (const minutes of durationsFor("swim")) {
      for (const effort of CREATE_EFFORTS) {
        for (const workout of suggestWorkouts(
          "swim",
          minutes,
          effort,
          DEFAULT_PACES,
        )) {
          const seconds = workoutSeconds(workout, DEFAULT_PACES);
          expect(seconds / (minutes * 60), workout.id).toBeGreaterThan(0.85);
          expect(seconds / (minutes * 60), workout.id).toBeLessThan(1.15);
        }
      }
    }
  });

  it("keeps the hard part of a long session sensible", () => {
    const [threshold] = suggestWorkouts("bike", 330, "hard", DEFAULT_PACES);
    const repeat = threshold.steps.find((step) => step.type === "repeat");
    expect(repeat?.type === "repeat" && repeat.reps).toBe(6);
    expect(threshold.steps.some((step) => step.type === "easy")).toBe(true);
  });

  it("returns nothing for a duration the sport doesn't offer", () => {
    expect(suggestWorkouts("swim", 180, "easy", DEFAULT_PACES)).toEqual([]);
  });
});

describe("workoutById", () => {
  it("finds every suggestion again by its id", () => {
    for (const { sport, minutes, effort } of combos) {
      for (const workout of suggestWorkouts(
        sport,
        minutes,
        effort,
        DEFAULT_PACES,
      )) {
        expect(workoutById(workout.id, DEFAULT_PACES)).toEqual(workout);
      }
    }
  });

  it("finds catalog workouts", () => {
    expect(workoutById("intervals-400", DEFAULT_PACES)?.sport).toBe("run");
  });

  it("refuses unknown ids", () => {
    for (const id of [
      "",
      "nope",
      "run.vo2.61",
      "swim.vo2.180",
      "run.unknown.60",
      "run.vo2.60.extra",
      "golf.vo2.60",
    ]) {
      expect(workoutById(id, DEFAULT_PACES), id).toBeNull();
    }
  });
});
