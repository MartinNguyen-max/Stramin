import { describe, expect, test } from "vitest";
import { daysUntil, localToday } from "./countdown";

describe("daysUntil", () => {
  test("counts whole days", () => {
    expect(daysUntil("2026-11-10", "2026-11-10")).toBe(0);
    expect(daysUntil("2026-11-11", "2026-11-10")).toBe(1);
    expect(daysUntil("2027-08-16", "2026-11-10")).toBe(279);
    expect(daysUntil("2026-11-09", "2026-11-10")).toBe(-1);
  });
});

describe("localToday", () => {
  test("uses the local calendar date", () => {
    expect(localToday(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});
