import type { Units } from "@/lib/preferences";

/**
 * The weekly goal (owner feedback 2026-11-17): hours per week, and optionally a distance or a time
 * per sport. Pure functions, shared by the form, the server action and "This week" on Home.
 */

/** Sports that can have their own weekly target. */
export const WEEKLY_SPORTS = ["swim", "bike", "run"] as const;
export type WeeklySport = (typeof WEEKLY_SPORTS)[number];

/** A sport's weekly target: a distance or a time. */
export type WeeklyTarget = { meters: number } | { seconds: number };

export type WeeklyGoal = {
  /** Hours per week in seconds, or null (then the average week is used). */
  totalSeconds: number | null;
  sports: Partial<Record<WeeklySport, WeeklyTarget>>;
};

/** At most 40 hours a week, in total and per sport. */
export const MAX_WEEK_SECONDS = 40 * 3600;

/** The longest plausible weekly distance per sport, in meters. */
export const MAX_WEEK_METERS: Record<WeeklySport, number> = {
  swim: 50_000,
  bike: 2_000_000,
  run: 300_000,
};

const METERS_PER_MILE = 1609.344;

/** True when nothing is set: such a goal is deleted instead of stored. */
export function isEmptyGoal(goal: WeeklyGoal): boolean {
  return (
    goal.totalSeconds === null &&
    WEEKLY_SPORTS.every((sport) => !goal.sports[sport])
  );
}

/**
 * Hours as people type them: "8", "7.5", "7,5" or "7:30". Returns seconds, or null when invalid.
 * Empty input is not a value: check for it before.
 */
export function parseHours(value: string): number | null {
  const text = value.trim();
  const clock = /^(\d{1,2}):([0-5]\d)$/.exec(text);
  if (clock) return Number(clock[1]) * 3600 + Number(clock[2]) * 60;
  if (!/^\d{1,2}([.,]\d{1,2})?$/.test(text)) return null;
  return Math.round(Number(text.replace(",", ".")) * 3600);
}

/** A distance in km (miles for imperial), "30" or "12,5". Returns meters, or null when invalid. */
export function parseDistance(value: string, units: Units): number | null {
  const text = value.trim();
  if (!/^\d{1,4}([.,]\d{1,2})?$/.test(text)) return null;
  const amount = Number(text.replace(",", "."));
  return Math.round(amount * (units === "imperial" ? METERS_PER_MILE : 1000));
}

/** Seconds as the form shows them: "7:30". */
export function hoursInput(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Meters as the form shows them: "30" or "12.5" (km, or miles for imperial). */
export function distanceInput(meters: number, units: Units): string {
  const value = meters / (units === "imperial" ? METERS_PER_MILE : 1000);
  return String(Math.round(value * 10) / 10);
}

export function isPlausibleSeconds(seconds: number): boolean {
  return seconds > 0 && seconds <= MAX_WEEK_SECONDS;
}

export function isPlausibleMeters(sport: WeeklySport, meters: number): boolean {
  return meters > 0 && meters <= MAX_WEEK_METERS[sport];
}
