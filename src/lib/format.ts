import type { Units } from "./preferences";

/** Formats seconds as "h:mm" (e.g. 5400 → "1:30"). */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

const METERS_PER_MILE = 1609.344;

/**
 * Formats a distance in the user's units (SET-1). Data is always stored in meters.
 * Swims are shown with one more decimal, since they are short.
 */
export function formatDistance(
  meters: number,
  units: Units,
  { precise = false }: { precise?: boolean } = {},
): string {
  const value = units === "imperial" ? meters / METERS_PER_MILE : meters / 1000;
  const unit = units === "imperial" ? "mi" : "km";
  return `${value.toFixed(precise ? 2 : 1)} ${unit}`;
}
