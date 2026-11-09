import { describe, expect, test } from "vitest";
import { formatDistance, formatDuration } from "./format";

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

describe("formatDistance", () => {
  test("metric", () => {
    expect(formatDistance(10_000, "metric")).toBe("10.0 km");
    expect(formatDistance(1500, "metric", { precise: true })).toBe("1.50 km");
  });

  test("imperial", () => {
    expect(formatDistance(1609.344, "imperial")).toBe("1.0 mi");
  });
});
