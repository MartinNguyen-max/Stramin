import { describe, expect, test } from "vitest";
import { legSuggestions } from "./feedback";
import {
  freshTime,
  freshTimeNeeded,
  legBasis,
  RACE_DAY_FACTOR,
  raceDayTime,
  TRIATHLONS,
  totalTime,
} from "./triathlon";

describe("triathlon legs", () => {
  test("the owner's example: a 3:27 marathon is about 3:58 in an Ironman", () => {
    const best = 3 * 3600 + 27 * 60;
    expect(raceDayTime("full", "run", best)).toBeCloseTo(best * 1.15);
    expect(raceDayTime("full", "run", best)).toBeGreaterThan(3.5 * 3600);
    // 3:30 on race day needs a fresh marathon of about 3:03.
    expect(freshTimeNeeded("full", "run", 3.5 * 3600)).toBeCloseTo(
      (3.5 * 3600) / 1.15,
    );
  });

  test("the best at the leg's distance is the basis, made slower for race day", () => {
    const bests = [
      { sport: "swim" as const, distance: 1900, seconds: 2400 },
      { sport: "run" as const, distance: 21_098, seconds: 92 * 60 },
    ];
    expect(legBasis("half", "swim", 1900, bests)).toBe(2400);
    expect(legBasis("half", "run", 21_097.5, bests)).toBeCloseTo(
      92 * 60 * RACE_DAY_FACTOR.half.run,
    );
  });

  test("without a best at the distance, a prediction from the other bests", () => {
    const bests = [{ sport: "bike" as const, distance: 40_000, seconds: 3600 }];
    const ninety = legBasis("half", "bike", 90_000, bests) ?? 0;
    expect(ninety).toBeGreaterThan(2.25 * 3600);
    expect(legBasis("half", "swim", 1900, bests)).toBeNull();
  });

  test("suggestions: 3 % faster, the basis, 5 % slower, rounded", () => {
    expect(legSuggestions(40 * 60)).toEqual([2325, 2400, 2520]);
  });

  test("the total adds the transitions", () => {
    expect(totalTime({ swim: 1, bike: 2, run: 3, transitions: 4 })).toBe(10);
  });

  test("a quarter Ironman's 45 km and 10.55 km are predicted from the other bests", () => {
    const bests = [
      { sport: "bike" as const, distance: 40_000, seconds: 4200 },
      { sport: "run" as const, distance: 10_000, seconds: 45 * 60 },
    ];
    const bike = freshTime("bike", 45_000, bests);
    const run = freshTime("run", 10_550, bests);
    expect(bike?.predicted).toBe(true);
    expect(bike?.seconds).toBeGreaterThan(4200);
    expect(run?.seconds).toBeGreaterThan(45 * 60);
    expect(freshTime("run", 10_000, bests)).toEqual({
      seconds: 45 * 60,
      predicted: false,
    });
    expect(TRIATHLONS.quarter.distance).toBe(56_550);
  });
});
