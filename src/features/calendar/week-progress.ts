import { DISTANCE_SPORTS } from "@/features/activities/sport-style";
import type { WeeklyGoal } from "@/features/goals/weekly";
import type { Calendar, Totals } from "@/lib/analytics/calendar";
import { SPORTS, type Sport } from "@/lib/analytics/sports";

/**
 * "This week" against a target (owner feedback 2026-11-17): the user's weekly goal where they set one,
 * else the average week of the shown period. Pure, so it's unit tested.
 */

/** Where a target comes from. */
export type TargetSource = "goal" | "average";

export type SportProgress = {
  sport: Sport;
  /** Distance sports count meters, unless their goal is a time; strength and other count seconds. */
  unit: "meters" | "seconds";
  done: number;
  /** The goal, else the average week; null without either. */
  target: number | null;
  source: TargetSource | null;
  /** The average week for this sport, in the same unit; null when it's 0 or there is no finished week. */
  average: number | null;
};

export type WeekProgress = {
  total: {
    done: number;
    target: number | null;
    source: TargetSource | null;
    /** Where the week should be by today: the goal spread evenly, else the usual hours by this day. */
    expectedSoFar: number | null;
  };
  sports: SportProgress[];
};

const isDistanceSport = (sport: Sport) =>
  (DISTANCE_SPORTS as readonly Sport[]).includes(sport);

export function weekProgress(
  current: NonNullable<Calendar["currentWeek"]>,
  average: Totals | null,
  goal: WeeklyGoal | null,
): WeekProgress {
  const week = current.week.totals;
  const totalGoal = goal?.totalSeconds ?? null;
  const total: WeekProgress["total"] =
    totalGoal !== null
      ? {
          done: week.totalSeconds,
          target: totalGoal,
          source: "goal",
          expectedSoFar: (totalGoal * current.day) / 7,
        }
      : {
          done: week.totalSeconds,
          target: average?.totalSeconds || null,
          source: average?.totalSeconds ? "average" : null,
          expectedSoFar: current.averageSoFar,
        };

  const sports: SportProgress[] = [];
  for (const sport of SPORTS) {
    const sportGoal = isDistanceSport(sport)
      ? goal?.sports[sport as keyof WeeklyGoal["sports"]]
      : undefined;
    const trained =
      week.seconds[sport] > 0 || (average?.seconds[sport] ?? 0) > 0;
    if (!sportGoal && !trained) continue;

    const unit: SportProgress["unit"] = sportGoal
      ? "meters" in sportGoal
        ? "meters"
        : "seconds"
      : isDistanceSport(sport) &&
          (week.meters[sport] > 0 || (average?.meters[sport] ?? 0) > 0)
        ? "meters"
        : "seconds";
    const averageValue = average ? average[unit][sport] : 0;
    const goalValue = sportGoal
      ? "meters" in sportGoal
        ? sportGoal.meters
        : sportGoal.seconds
      : null;

    sports.push({
      sport,
      unit,
      done: week[unit][sport],
      target: goalValue ?? (averageValue > 0 ? averageValue : null),
      source: goalValue !== null ? "goal" : averageValue > 0 ? "average" : null,
      average: averageValue > 0 ? averageValue : null,
    });
  }
  return { total, sports };
}
