import { describe, expect, test } from "vitest";
import {
  formatClock,
  formatDistance,
  formatDuration,
  formatSportDistance,
  formatSportPace,
  parseClock,
} from "./format";

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
