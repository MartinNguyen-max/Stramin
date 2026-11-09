import { describe, expect, test } from "vitest";
import { sportFromStrava } from "./sports";
import { weeklyTotals, weekStartOf } from "./weekly";

describe("weekStartOf", () => {
  test("Monday start: a Sunday belongs to the week that began the Monday before", () => {
    // 2026-11-08 is a Sunday.
    expect(weekStartOf("2026-11-08T21:00:00Z")).toBe("2026-11-02");
  });

  test("Monday start: a Monday starts its own week", () => {
    expect(weekStartOf("2026-11-09T06:00:00Z")).toBe("2026-11-09");
  });

  test("Sunday start", () => {
    expect(weekStartOf("2026-11-09T06:00:00Z", "sunday")).toBe("2026-11-08");
  });

  test("uses the local calendar day, ignoring the fake Z offset", () => {
    expect(weekStartOf("2026-11-08T23:59:59Z")).toBe("2026-11-02");
  });
});

describe("weeklyTotals", () => {
  test("sums seconds per sport and per week, newest week first", () => {
    const weeks = weeklyTotals([
      {
        sport: "run",
        startLocal: "2026-11-02T07:00:00Z",
        durationSeconds: 1800,
      },
      {
        sport: "run",
        startLocal: "2026-11-04T07:00:00Z",
        durationSeconds: 3600,
      },
      {
        sport: "bike",
        startLocal: "2026-11-08T09:00:00Z",
        durationSeconds: 7200,
      },
      {
        sport: "swim",
        startLocal: "2026-11-09T06:00:00Z",
        durationSeconds: 2700,
      },
    ]);

    expect(weeks.map((w) => w.weekStart)).toEqual(["2026-11-09", "2026-11-02"]);
    expect(weeks[1].seconds.run).toBe(5400);
    expect(weeks[1].seconds.bike).toBe(7200);
    expect(weeks[1].totalSeconds).toBe(12600);
    expect(weeks[0].seconds.swim).toBe(2700);
  });
});

describe("sportFromStrava", () => {
  test("maps triathlon sports and strength", () => {
    expect(sportFromStrava("VirtualRide")).toBe("bike");
    expect(sportFromStrava("TrailRun")).toBe("run");
    expect(sportFromStrava("Swim")).toBe("swim");
    expect(sportFromStrava("WeightTraining")).toBe("strength");
  });

  test("e-bikes, CrossFit and unknown types are other", () => {
    expect(sportFromStrava("EBikeRide")).toBe("other");
    expect(sportFromStrava("Crossfit")).toBe("other");
    expect(sportFromStrava("Yoga")).toBe("other");
  });
});
