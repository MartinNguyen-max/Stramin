import { describe, expect, it } from "vitest";
import {
  type Calendar,
  emptyCalendarTotals,
  type Totals,
} from "@/lib/analytics/calendar";
import { weekProgress } from "./week-progress";

function totals(
  values: Partial<
    Record<"swim" | "bike" | "run" | "strength", [number, number]>
  >,
): Totals {
  const result = emptyCalendarTotals();
  for (const [sport, [seconds, meters]] of Object.entries(values)) {
    result.seconds[sport as "run"] = seconds;
    result.meters[sport as "run"] = meters;
    result.totalSeconds += seconds;
    result.count += 1;
  }
  return result;
}

function current(
  week: Totals,
  day = 3,
  averageSoFar: number | null = null,
): NonNullable<Calendar["currentWeek"]> {
  return {
    week: { totals: week } as NonNullable<Calendar["currentWeek"]>["week"],
    day,
    usualDays: null,
    averageSoFar,
  };
}

describe("weekProgress", () => {
  const week = totals({ run: [3600, 12_000], strength: [1800, 0] });
  const average = totals({
    run: [7200, 20_000],
    bike: [7200, 60_000],
    strength: [1800, 0],
  });

  it("uses the average week without a goal", () => {
    const progress = weekProgress(current(week, 3, 4000), average, null);
    expect(progress.total).toEqual({
      done: 5400,
      target: 16_200,
      source: "average",
      expectedSoFar: 4000,
    });
    expect(progress.sports).toEqual([
      {
        sport: "bike",
        unit: "meters",
        done: 0,
        target: 60_000,
        source: "average",
        average: 60_000,
      },
      {
        sport: "run",
        unit: "meters",
        done: 12_000,
        target: 20_000,
        source: "average",
        average: 20_000,
      },
      {
        sport: "strength",
        unit: "seconds",
        done: 1800,
        target: 1800,
        source: "average",
        average: 1800,
      },
    ]);
  });

  it("uses the goal where it's set and spreads the hours over the week", () => {
    const progress = weekProgress(current(week, 2, 4000), average, {
      totalSeconds: 7 * 3600,
      sports: { run: { seconds: 3 * 3600 }, swim: { meters: 3000 } },
    });
    expect(progress.total).toEqual({
      done: 5400,
      target: 7 * 3600,
      source: "goal",
      expectedSoFar: 2 * 3600,
    });
    const [swim, bike, run] = progress.sports;
    expect(swim).toEqual({
      sport: "swim",
      unit: "meters",
      done: 0,
      target: 3000,
      source: "goal",
      average: null,
    });
    expect(bike.source).toBe("average");
    expect(run).toEqual({
      sport: "run",
      unit: "seconds",
      done: 3600,
      target: 3 * 3600,
      source: "goal",
      average: 7200,
    });
  });

  it("has no target without a goal or a finished week", () => {
    const progress = weekProgress(current(week), null, null);
    expect(progress.total.target).toBeNull();
    expect(progress.sports.map((s) => [s.sport, s.target])).toEqual([
      ["run", null],
      ["strength", null],
    ]);
  });
});
