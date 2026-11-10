import { describe, expect, test } from "vitest";
import {
  formatClock,
  formatDistance,
  formatDuration,
  formatHours,
  formatPaceDifference,
  formatSportDistance,
  formatSportPace,
  formatTotalDistance,
  parseClock,
} from "./format";

describe("formatHours", () => {
  test("minutes under an hour, h:mm with the unit from an hour", () => {
    expect(formatHours(53 * 60, "h")).toBe("53 min");
    expect(formatHours(80 * 60, "t")).toBe("1:20 t");
    expect(formatHours(5 * 3600 + 50 * 60, "h")).toBe("5:50 h");
  });

  test("59.6 minutes round up to an hour", () => {
    expect(formatHours(3580, "h")).toBe("1:00 h");
  });
});

describe("formatPaceDifference", () => {
  test("the owner's half: 1:32 → 1:20 is 34 s faster per km", () => {
    expect(
      formatPaceDifference("run", 21_097.5, 92 * 60, 80 * 60, "metric"),
    ).toBe("34 s/km");
  });

  test("swim per 100 m, bike in km/h, nothing without a gap", () => {
    expect(formatPaceDifference("swim", 1900, 38 * 60, 34 * 60, "metric")).toBe(
      "13 s/100m",
    );
    expect(
      formatPaceDifference("bike", 90_000, 3 * 3600, 2.5 * 3600, "metric"),
    ).toBe("6.0 km/h");
    expect(formatPaceDifference("run", 5000, 1000, 1100, "metric")).toBeNull();
  });
});

describe("formatTotalDistance", () => {
  test("km for every sport, no decimals from 100", () => {
    expect(formatTotalDistance(3200, "metric")).toBe("3.2 km");
    expect(formatTotalDistance(119_400, "metric")).toBe("119 km");
    expect(formatTotalDistance(1609.344 * 120, "imperial")).toBe("120 mi");
  });
});

describe("formatDuration", () => {
  test("formats hours and minutes", () => {
    expect(formatDuration(5400)).toBe("1:30");
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(36_000 + 59 * 60)).toBe("10:59");
  });

  test("rounds to the nearest minute without producing :60", () => {
    expect(formatDuration(3599)).toBe("1:00");
  });
});

describe("formatClock / parseClock", () => {
  test("formats", () => {
    expect(formatClock(4240)).toBe("1:10:40");
    expect(formatClock(2758)).toBe("45:58");
    expect(formatClock(42)).toBe("0:42");
    expect(formatClock(1199.6)).toBe("20:00");
  });

  test("parses", () => {
    expect(parseClock("1:10:40")).toBe(4240);
    expect(parseClock("19:45")).toBe(1185);
    expect(parseClock(" 58 ")).toBe(58);
    expect(parseClock("19:75")).toBeNull();
    expect(parseClock("abc")).toBeNull();
    expect(parseClock("1:2:3:4")).toBeNull();
    expect(parseClock("")).toBeNull();
  });
});

describe("formatDistance", () => {
  test("metric", () => {
    expect(formatDistance(10_000, "metric")).toBe("10.0 km");
    expect(formatDistance(1500, "metric", { precise: true })).toBe("1.50 km");
  });

  test("imperial", () => {
    expect(formatDistance(1609.344, "imperial")).toBe("1.0 mi");
  });

  test("swims in meters", () => {
    expect(formatSportDistance("swim", 1150, "metric")).toBe("1,150 m");
    expect(formatSportDistance("run", 13_090, "metric")).toBe("13.1 km");
  });
});

describe("formatSportPace", () => {
  test("run pace, bike speed, swim pace", () => {
    expect(formatSportPace("run", 13_090, 4240, "metric")).toBe("5:24 /km");
    expect(formatSportPace("bike", 67_650, 8390, "metric")).toBe("29.0 km/h");
    expect(formatSportPace("swim", 1150, 1484, "metric")).toBe("2:09 /100m");
  });

  test("no pace for strength or without distance", () => {
    expect(formatSportPace("strength", 0, 3600, "metric")).toBeNull();
    expect(formatSportPace("run", 0, 78, "metric")).toBeNull();
  });
});
