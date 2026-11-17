import { describe, expect, it } from "vitest";
import {
  distanceInput,
  hoursInput,
  isEmptyGoal,
  isPlausibleMeters,
  isPlausibleSeconds,
  parseDistance,
  parseHours,
} from "./weekly";

describe("parseHours", () => {
  it("reads whole hours, decimals and clock times", () => {
    expect(parseHours("8")).toBe(8 * 3600);
    expect(parseHours("7.5")).toBe(7.5 * 3600);
    expect(parseHours("7,5")).toBe(7.5 * 3600);
    expect(parseHours(" 7:30 ")).toBe(7.5 * 3600);
    expect(parseHours("0:45")).toBe(45 * 60);
  });

  it("rejects anything else", () => {
    expect(parseHours("abc")).toBeNull();
    expect(parseHours("7:75")).toBeNull();
    expect(parseHours("-3")).toBeNull();
    expect(parseHours("123")).toBeNull();
  });
});

describe("parseDistance", () => {
  it("reads km, or miles for imperial", () => {
    expect(parseDistance("30", "metric")).toBe(30_000);
    expect(parseDistance("12,5", "metric")).toBe(12_500);
    expect(parseDistance("10", "imperial")).toBe(16_093);
  });

  it("rejects invalid input", () => {
    expect(parseDistance("ten", "metric")).toBeNull();
    expect(parseDistance("1.234", "metric")).toBeNull();
  });
});

describe("form values", () => {
  it("shows seconds as h:mm and meters as km", () => {
    expect(hoursInput(7.5 * 3600)).toBe("7:30");
    expect(distanceInput(12_500, "metric")).toBe("12.5");
    expect(distanceInput(16_093, "imperial")).toBe("10");
  });
});

describe("limits", () => {
  it("keeps targets plausible", () => {
    expect(isPlausibleSeconds(8 * 3600)).toBe(true);
    expect(isPlausibleSeconds(0)).toBe(false);
    expect(isPlausibleSeconds(41 * 3600)).toBe(false);
    expect(isPlausibleMeters("run", 50_000)).toBe(true);
    expect(isPlausibleMeters("swim", 60_000)).toBe(false);
  });
});

describe("isEmptyGoal", () => {
  it("is empty without hours and sport targets", () => {
    expect(isEmptyGoal({ totalSeconds: null, sports: {} })).toBe(true);
    expect(
      isEmptyGoal({ totalSeconds: null, sports: { run: { meters: 1 } } }),
    ).toBe(false);
  });
});
