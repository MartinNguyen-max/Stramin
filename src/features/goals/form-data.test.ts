import { describe, expect, test } from "vitest";
import { draftFromParams } from "./form-data";

describe("draftFromParams (Set as goal)", () => {
  test("a single-sport goal from the calculator", () => {
    expect(
      draftFromParams({ sport: "run", distance: "5000", time: "20:50" }),
    ).toEqual({ sport: "run", distance: 5000, time: "20:50" });
  });

  test("a triathlon with its splits", () => {
    expect(
      draftFromParams({
        sport: "triathlon",
        race: "quarter",
        swim: "20:00",
        bike: "1:20:00",
        run: "50:00",
        transitions: "4:00",
      }),
    ).toEqual({
      sport: "triathlon",
      race: "quarter",
      splits: {
        swim: "20:00",
        bike: "1:20:00",
        run: "50:00",
        transitions: "4:00",
      },
    });
  });

  test("invalid input is left out", () => {
    expect(draftFromParams({})).toBeNull();
    expect(draftFromParams({ sport: "ski" })).toBeNull();
    expect(draftFromParams({ sport: "triathlon", race: "double" })).toBeNull();
    expect(
      draftFromParams({ sport: "bike", distance: "12345" })?.distance,
    ).toBeUndefined();
  });
});
