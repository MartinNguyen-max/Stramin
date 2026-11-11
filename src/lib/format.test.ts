import { describe, expect, test } from "vitest";
import {
  formatClock,
  formatDistance,
  formatDuration,
  formatHours,
  formatPaceDifference,
  formatRoundDistance,
  formatSportDistance,
  formatSportPace,
  formatTimeDigits,
  formatTimeGap,
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

describe("formatRoundDistance", () => {
  test("whole km from 10, else one decimal", () => {
    expect(formatRoundDistance(50_000, "metric")).toBe("50 km");
    expect(formatRoundDistance(31_800, "metric")).toBe("32 km");
    expect(formatRoundDistance(2168, "metric")).toBe("2.2 km");
  });
});

describe("formatTimeGap", () => {
  test("seconds, minutes or hours, always with a unit", () => {
    expect(formatTimeGap(41, "t")).toBe("41 s");
    expect(formatTimeGap(11 * 60 + 57, "t")).toBe("11:57 min");
    expect(formatTimeGap(3930, "h")).toBe("1:05:30 h");
  });
});

describe("formatTimeDigits", () => {
  test("digits fill seconds, then minutes, then hours", () => {
    expect(formatTimeDigits("18")).toBe("18");
    expect(formatTimeDigits("330")).toBe("3:30");
    expect(formatTimeDigits("1805")).toBe("18:05");
    expect(formatTimeDigits("12930")).toBe("1:29:30");
    expect(formatTimeDigits("103000")).toBe("10:30:00");
  });

  test("ignores colons and other characters, and stops at 6 digits", () => {
    expect(formatTimeDigits("1:29:30")).toBe("1:29:30");
    expect(formatTimeDigits("18:0")).toBe("1:80");
    expect(formatTimeDigits("1234567")).toBe("12:34:56");
    expect(formatTimeDigits("")).toBe("");
  });

  test("leading zeros don't make an hour", () => {
    expect(formatTimeDigits("01805")).toBe("18:05");
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
