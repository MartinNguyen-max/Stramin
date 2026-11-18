import { describe, expect, test } from "vitest";
import { parseRateLimit, RateTracker, stravaId } from "./client";

describe("rate limits (NFR-4)", () => {
  test("prefers the read limit headers", () => {
    const headers = new Headers({
      "X-RateLimit-Limit": "200,2000",
      "X-RateLimit-Usage": "10,100",
      "X-ReadRateLimit-Limit": "100,1000",
      "X-ReadRateLimit-Usage": "85,300",
    });
    expect(parseRateLimit(headers)).toEqual({
      shortUsed: 85,
      shortLimit: 100,
      dailyUsed: 300,
      dailyLimit: 1000,
    });
  });

  test("falls back to the overall limit, and ignores missing headers", () => {
    expect(
      parseRateLimit(
        new Headers({
          "X-RateLimit-Limit": "200,2000",
          "X-RateLimit-Usage": "1,2",
        }),
      )?.shortLimit,
    ).toBe(200);
    expect(parseRateLimit(new Headers())).toBeNull();
  });

  test("the tracker stops at 80 %", () => {
    const tracker = new RateTracker();
    expect(tracker.nearLimit()).toBe(false);
    tracker.record(
      new Headers({
        "X-RateLimit-Limit": "100,1000",
        "X-RateLimit-Usage": "79,10",
      }),
    );
    expect(tracker.nearLimit()).toBe(false);
    tracker.record(
      new Headers({
        "X-RateLimit-Limit": "100,1000",
        "X-RateLimit-Usage": "80,10",
      }),
    );
    expect(tracker.nearLimit()).toBe(true);
    expect(tracker.requests).toBe(2);
  });
});

describe("stravaId", () => {
  test("prefers id_str", () => {
    expect(stravaId({ id: 1, id_str: "9007199254740993" })).toBe(
      "9007199254740993",
    );
  });

  test("uses id when there is no id_str", () => {
    expect(stravaId({ id: 42 })).toBe("42");
  });
});
