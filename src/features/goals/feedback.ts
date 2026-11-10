import type { Effort } from "@/features/training/zones";
import {
  type BestEffort,
  distanceKey,
  type EffortSport,
  findEffort,
} from "@/lib/analytics/best-efforts";
import type { CalendarActivity } from "@/lib/analytics/calendar";
import { equivalentTime, vdot } from "@/lib/analytics/running";
import { type WeekStartDay, weekStartOf } from "@/lib/analytics/weekly";
import { addDays } from "@/lib/dates";

/**
 * Goal rules (GOAL-3..6), exactly as written in docs/feedback-rules.md. Pure functions, unit tested.
 */

/** "Nice" rounding step for a time: 5 s under 30 min, 15 s under 2 h, else 1 min. */
function roundingStep(seconds: number): number {
  if (seconds < 30 * 60) return 5;
  if (seconds < 2 * 3600) return 15;
  return 60;
}

/** Suggested targets 2 %, 5 % and 10 % faster than the best, rounded, always faster than it (GOAL-5). */
export function suggestTargets(best: number): number[] {
  const result: number[] = [];
  for (const share of [0.02, 0.05, 0.1]) {
    const raw = best * (1 - share);
    const step = roundingStep(raw);
    let target = Math.round(raw / step) * step;
    if (target >= best) target -= step;
    if (!result.includes(target)) result.push(target);
  }
  return result;
}

/** Faster than (or equal to) the current best is required (GOAL-5). */
export function isTargetAllowed(
  target: number,
  best: number | undefined,
): boolean {
  return best === undefined || target < best;
}

export type GapLevel = "achieved" | "close" | "season" | "big";

export type Gap = {
  level: GapLevel;
  seconds: number;
  /** Share of the best, e.g. 0.036. */
  share: number;
  /** For "big": an in-between goal 4 % faster than now. */
  stepTarget?: number;
};

export function gapFor(target: number, best: number): Gap {
  const seconds = best - target;
  const share = seconds / best;
  if (seconds <= 0) return { level: "achieved", seconds, share };
  if (share <= 0.03) return { level: "close", seconds, share };
  if (share <= 0.08) return { level: "season", seconds, share };
  const raw = best * 0.96;
  const step = roundingStep(raw);
  return {
    level: "big",
    seconds,
    share,
    stepTarget: Math.round(raw / step) * step,
  };
}

/**
 * The next shorter standard distance, for the speed check (running only). Keyed by `distanceKey`:
 * goals store the half marathon as 21 098 m.
 */
const SPEED_REFERENCE: Record<number, number> = {
  5000: 1000,
  10000: 5000,
  21098: 5000,
  42195: 5000,
};

export type SpeedCheck = {
  /** The reference distance and the time it needs. */
  distance: number;
  needed: number;
  /** The user's best at the reference distance, if any. */
  best?: number;
  limiter: "speed" | "endurance" | null;
};

/** "10 km in 40:00 ≈ 19:15 on 5 km", compared with the user's own 5 km (GOAL-6). */
export function speedCheck(
  sport: EffortSport,
  distance: number,
  target: number,
  efforts: BestEffort[],
): SpeedCheck | null {
  const reference =
    sport === "run" ? SPEED_REFERENCE[distanceKey(distance)] : undefined;
  if (!reference) return null;
  const needed = equivalentTime(vdot(distance, target), reference);
  const best = findEffort(efforts, "run", reference)?.seconds;
  return {
    distance: reference,
    needed,
    best,
    limiter:
      best === undefined ? null : best > needed * 1.01 ? "speed" : "endurance",
  };
}

/** Recommended weekly volume in meters for a goal distance (feedback-rules.md §4). */
export function recommendedVolume(
  sport: EffortSport,
  distance: number,
): number {
  if (sport === "run") {
    if (distance <= 5000) return 20_000;
    if (distance <= 10_000) return 30_000;
    if (distanceKey(distance) <= 21_098) return 40_000;
    return 55_000;
  }
  if (sport === "bike") {
    if (distance <= 40_000) return 80_000;
    if (distance <= 90_000) return 150_000;
    return 200_000;
  }
  if (distance <= 1000) return 4000;
  if (distance <= 1900) return 6000;
  return 8000;
}

export type VolumeCheck = {
  perWeek: number;
  recommended: number;
  enough: boolean;
};

export function volumeCheck(
  sport: EffortSport,
  distance: number,
  metersPerWeek: number | null,
): VolumeCheck | null {
  if (metersPerWeek === null) return null;
  const recommended = recommendedVolume(sport, distance);
  return {
    perWeek: metersPerWeek,
    recommended,
    enough: metersPerWeek >= recommended * 0.8,
  };
}

export type GoalFeedback = {
  gap: Gap | null;
  speed: SpeedCheck | null;
  volume: VolumeCheck | null;
  /** Which workouts to suggest, in order (feedback-rules.md §5). */
  efforts: Effort[];
};

/** All feedback for a goal (GOAL-3..6). */
export function goalFeedback(
  goal: { sport: EffortSport; distance: number; target: number },
  efforts: BestEffort[],
  metersPerWeek: number | null,
): GoalFeedback {
  const best = findEffort(efforts, goal.sport, goal.distance)?.seconds;
  const gap = best === undefined ? null : gapFor(goal.target, best);
  const speed = speedCheck(goal.sport, goal.distance, goal.target, efforts);
  const volume = volumeCheck(goal.sport, goal.distance, metersPerWeek);

  const suggested: Effort[] = [];
  if (gap?.level !== "achieved") {
    if (speed?.limiter === "speed") suggested.push("hard");
    if (speed?.limiter === "endurance") suggested.push("moderate");
    if (volume && !volume.enough) suggested.push("easy");
    if (volume?.enough && !suggested.includes("hard")) suggested.push("hard");
    if (suggested.length === 0) suggested.push("hard", "easy");
  }
  return { gap, speed, volume, efforts: suggested };
}

/** `averageWeeklyMeters` for swim, bike and run at once (triathlon goals need all three). */
export function weeklyMetersBySport(
  activities: CalendarActivity[],
  todayDate: string,
  weekStartDay: WeekStartDay,
): Record<EffortSport, number> {
  const average = (sport: EffortSport) =>
    averageWeeklyMeters(activities, sport, todayDate, weekStartDay);
  return { run: average("run"), bike: average("bike"), swim: average("swim") };
}

/** Average weekly distance of a sport over the last `weeks` finished weeks (feedback-rules.md §4). */
export function averageWeeklyMeters(
  activities: CalendarActivity[],
  sport: EffortSport,
  todayDate: string,
  weekStartDay: WeekStartDay,
  weeks = 8,
): number {
  const currentWeek = weekStartOf(todayDate, weekStartDay);
  const from = addDays(currentWeek, -7 * weeks);
  let meters = 0;
  for (const activity of activities) {
    const day = activity.startLocal.slice(0, 10);
    if (activity.sport === sport && day >= from && day < currentWeek) {
      meters += activity.distanceMeters;
    }
  }
  return meters / weeks;
}
