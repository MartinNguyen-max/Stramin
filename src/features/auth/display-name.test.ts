import { describe, expect, test } from "vitest";
import { displayName } from "./display-name";

describe("displayName", () => {
  test("prefers the chosen name", () => {
    expect(
      displayName({ display_name: "Martin", full_name: "Someone Else" }),
    ).toBe("Martin");
  });

  test("falls back to the first name from Google", () => {
    expect(displayName({ full_name: "Martin Nguyen" })).toBe("Martin");
    expect(displayName({ name: "Søren Kierkegaard" })).toBe("Søren");
  });

  test("returns undefined when there is no valid name", () => {
    expect(displayName(undefined)).toBeUndefined();
    expect(displayName({})).toBeUndefined();
    expect(displayName({ display_name: "<script>" })).toBeUndefined();
  });
});
