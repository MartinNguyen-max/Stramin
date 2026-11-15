import { describe, expect, it } from "vitest";
import { parseThisWeekChoices, thisWeekOpen } from "./preference";

describe("This week open or closed", () => {
  it("is open on 1M and 3M and closed on longer periods by default", () => {
    expect(thisWeekOpen({}, "1m")).toBe(true);
    expect(thisWeekOpen({}, "3m")).toBe(true);
    expect(thisWeekOpen({}, "6m")).toBe(false);
    expect(thisWeekOpen({}, "1y")).toBe(false);
    expect(thisWeekOpen({}, "all")).toBe(false);
    expect(thisWeekOpen({}, "custom")).toBe(false);
  });

  it("follows the user's choice per period type", () => {
    const choices = parseThisWeekChoices('{"6m":true,"1m":false}');
    expect(thisWeekOpen(choices, "6m")).toBe(true);
    expect(thisWeekOpen(choices, "1m")).toBe(false);
    expect(thisWeekOpen(choices, "3m")).toBe(true);
  });

  it("ignores anything unexpected", () => {
    expect(parseThisWeekChoices("not json")).toEqual({});
    expect(parseThisWeekChoices('{"6m":"yes","bad":true}')).toEqual({});
    expect(parseThisWeekChoices(undefined)).toEqual({});
  });
});
