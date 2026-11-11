import type { Sport } from "./analytics/sports";
import type { Units } from "./preferences";

/** Formats seconds as "h:mm" (e.g. 5400 → "1:30"). Used for totals. */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

/**
 * A duration people read as time spent: "53 min" under an hour, else "1:20 h" (owner feedback 2026-11-11, T5).
 * `hourUnit` is the translated hour symbol ("h", Danish "t").
 */
export function formatHours(seconds: number, hourUnit: string): string {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  return `${formatDuration(seconds)} ${hourUnit}`;
}

/**
 * A time difference with its unit (owner feedback 2026-11-12): "57 s", "11:57 min" or "1:05:30 h".
 * `hourUnit` is the translated hour symbol ("h", Danish "t").
 */
export function formatTimeGap(seconds: number, hourUnit: string): string {
  const total = Math.round(Math.abs(seconds));
  if (total < 60) return `${total} s`;
  if (total < 3600) return `${formatClock(total)} min`;
  return `${formatClock(total)} ${hourUnit}`;
}

/** Formats seconds as a clock time: "1:10:40", "45:58" or "0:42". Used for workouts and best efforts. */
export function formatClock(seconds: number): string {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const ss = String(secs).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
  }
  return `${minutes}:${ss}`;
}

/**
 * Formats what someone types into a time field (owner feedback 2026-11-12): only the digits count,
 * grouped in pairs from the right, so "1805" → "18:05", "330" → "3:30", "12930" → "1:29:30".
 * At most 6 digits (99:59:59). Pasting "1:29:30" works too.
 */
export function formatTimeDigits(value: string): string {
  const digits = value
    .replace(/\D/g, "")
    .replace(/^0+(?=\d{3})/, "")
    .slice(0, 6);
  if (digits.length <= 2) return digits;
  const seconds = digits.slice(-2);
  const minutes = digits.slice(-4, -2);
  const hours = digits.slice(0, -4);
  return hours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

/** Parses "1:10:40", "45:58" or "58" (seconds) into seconds. Returns null for invalid input. */
export function parseClock(value: string): number | null {
  const parts = value.trim().split(":");
  if (parts.length === 0 || parts.length > 3) return null;
  if (!parts.every((part) => /^\d{1,3}$/.test(part))) return null;
  const numbers = parts.map(Number);
  // Minutes and seconds after the first part must be below 60.
  if (numbers.slice(1).some((n) => n >= 60)) return null;
  return numbers.reduce((total, n) => total * 60 + n, 0);
}

const METERS_PER_MILE = 1609.344;
const METERS_PER_YARD = 0.9144;

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

/**
 * A distance in totals (week, month, period): always km (mi), also for swims (owner feedback 2026-11-11, C1).
 * From 100 km (mi) without decimals, so the numbers stay short ("119 km", "32.4 km").
 */
export function formatTotalDistance(meters: number, units: Units): string {
  const value = units === "imperial" ? meters / METERS_PER_MILE : meters / 1000;
  const unit = units === "imperial" ? "mi" : "km";
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${unit}`;
}

/** A distance as it's best read for the sport: swims in meters (yards) up to 10 km, the rest in km (miles). */
export function formatSportDistance(
  sport: Sport,
  meters: number,
  units: Units,
): string {
  if (sport === "swim" && meters < 10_000) {
    return units === "imperial"
      ? `${Math.round(meters / METERS_PER_YARD).toLocaleString("en")} yd`
      : `${Math.round(meters).toLocaleString("en")} m`;
  }
  return formatDistance(meters, units);
}

/** A distance in a sentence: always km (mi), whole numbers from 10 ("50 km", "2.2 km"). */
export function formatRoundDistance(meters: number, units: Units): string {
  const value = units === "imperial" ? meters / METERS_PER_MILE : meters / 1000;
  const unit = units === "imperial" ? "mi" : "km";
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${unit}`;
}

/** Pace per km (mi) for a distance and time, e.g. "5:21 /km". */
export function formatPacePerKm(
  meters: number,
  seconds: number,
  units: Units,
): string {
  const unitMeters = units === "imperial" ? METERS_PER_MILE : 1000;
  return `${formatClock((seconds / meters) * unitMeters)} /${units === "imperial" ? "mi" : "km"}`;
}

/** Pace per 100 m (100 yd), e.g. "2:07 /100m". */
export function formatPacePer100(
  meters: number,
  seconds: number,
  units: Units,
): string {
  const unitMeters = units === "imperial" ? 100 * METERS_PER_YARD : 100;
  return `${formatClock((seconds / meters) * unitMeters)} /100${units === "imperial" ? "yd" : "m"}`;
}

/** Speed in km/h (mph), e.g. "28.9 km/h". */
export function formatSpeed(
  meters: number,
  seconds: number,
  units: Units,
): string {
  const perHour = (meters / seconds) * 3600;
  return units === "imperial"
    ? `${(perHour / METERS_PER_MILE).toFixed(1)} mph`
    : `${(perHour / 1000).toFixed(1)} km/h`;
}

/**
 * How much faster `target` is than `best` over `distance`, in the sport's pace (owner feedback
 * 2026-11-11, G3): "35 s/km", "1:05 /km", "12 s/100m", or for bikes "3.5 km/h". Null without a gap.
 */
export function formatPaceDifference(
  sport: Sport,
  distance: number,
  best: number,
  target: number,
  units: Units,
): string | null {
  if (distance <= 0 || target <= 0 || best <= target) return null;
  const imperial = units === "imperial";
  if (sport === "bike") {
    const perHour = (distance / target - distance / best) * 3600;
    return imperial
      ? `${(perHour / METERS_PER_MILE).toFixed(1)} mph`
      : `${(perHour / 1000).toFixed(1)} km/h`;
  }
  const [unitMeters, unit] =
    sport === "swim"
      ? imperial
        ? [100 * METERS_PER_YARD, "100yd"]
        : [100, "100m"]
      : imperial
        ? [METERS_PER_MILE, "mi"]
        : [1000, "km"];
  const seconds = Math.round(((best - target) / distance) * unitMeters);
  if (seconds < 1) return null;
  return seconds < 60
    ? `${seconds} s/${unit}`
    : `${formatClock(seconds)} /${unit}`;
}

/**
 * The pace or speed that fits the sport (HOME-3): run min/km, bike km/h, swim min/100 m.
 * Null when there is no distance or the sport has no pace (strength, other).
 */
export function formatSportPace(
  sport: Sport,
  meters: number,
  seconds: number,
  units: Units,
): string | null {
  if (meters <= 0 || seconds <= 0) return null;
  switch (sport) {
    case "run":
      return formatPacePerKm(meters, seconds, units);
    case "bike":
      return formatSpeed(meters, seconds, units);
    case "swim":
      return formatPacePer100(meters, seconds, units);
    default:
      return null;
  }
}
