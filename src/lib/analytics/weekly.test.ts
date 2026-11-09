import { describe, expect, test } from "vitest";
import { sportFromStrava } from "./sports";
import { averageWeek, lastWeeks, weeklyTotals, weekStartOf } from "./weekly";

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
  test("sums seconds and meters per sport and per week, newest week first", () => {
    const weeks = weeklyTotals([
      {
        sport: "run",
        startLocal: "2026-11-02T07:00:00Z",
        durationSeconds: 1800,
        distanceMeters: 5000,
      },
      {
        sport: "run",
        startLocal: "2026-11-04T07:00:00Z",
        durationSeconds: 3600,
        distanceMeters: 10000,
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
    expect(weeks[1].meters.run).toBe(15000);
    expect(weeks[1].seconds.bike).toBe(7200);
    expect(weeks[1].meters.bike).toBe(0);
    expect(weeks[1].totalSeconds).toBe(12600);
    expect(weeks[0].seconds.swim).toBe(2700);
  });
});

describe("lastWeeks", () => {
  test("fills rest weeks with zeros, newest first", () => {
    const weeks = weeklyTotals([
      {
        sport: "run",
        startLocal: "2026-10-20T07:00:00Z",
        durationSeconds: 600,
      },
    ]);
    const result = lastWeeks(weeks, "2026-11-11T12:00:00Z", 4);
    expect(result.map((w) => w.weekStart)).toEqual([
      "2026-11-09",
      "2026-11-02",
      "2026-10-26",
      "2026-10-19",
    ]);
    expect(result[0].totalSeconds).toBe(0);
    expect(result[3].seconds.run).toBe(600);
  });
});

describe("averageWeek", () => {
  const weeks = weeklyTotals([
    // Current week (2026-11-09): excluded from averages.
    {
      sport: "run",
      startLocal: "2026-11-10T07:00:00Z",
      durationSeconds: 99999,
    },
    // Two finished weeks within the last 4.
    {
      sport: "run",
      startLocal: "2026-11-03T07:00:00Z",
      durationSeconds: 3600,
      distanceMeters: 10000,
    },
    {
      sport: "run",
      startLocal: "2026-10-27T07:00:00Z",
      durationSeconds: 3600,
      distanceMeters: 10000,
    },
  ]);

  test("divides by all weeks in the period, including rest weeks", () => {
    const avg = averageWeek(weeks, "2026-11-11T12:00:00Z", "4w");
    expect(avg.weeks).toBe(4);
    expect(avg.seconds.run).toBe(1800);
    expect(avg.meters.run).toBe(5000);
  });

  test("'all' starts at the first week with training", () => {
    const avg = averageWeek(weeks, "2026-11-11T12:00:00Z", "all");
    expect(avg.weeks).toBe(2);
    expect(avg.meters.run).toBe(10000);
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
