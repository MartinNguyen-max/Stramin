/**
 * Calendar-date helpers on plain strings: dates are "YYYY-MM-DD", months are "YYYY-MM".
 * All math is done in UTC on the date part only, so the athlete's local calendar day is kept,
 * whatever the server's timezone is.
 */

const DAY_MS = 86_400_000;

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function utc(date: string): Date {
  return new Date(`${date.slice(0, 10)}T00:00:00Z`);
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** True for a real calendar date such as "2026-02-28" (not "2026-02-30"). */
export function isValidDate(value: string): boolean {
  return DATE_RE.test(value) && iso(utc(value)) === value;
}

export function isValidMonth(value: string): boolean {
  return MONTH_RE.test(value);
}

/** Today's date in UTC. */
export function today(now: Date = new Date()): string {
  return iso(now);
}

export function addDays(date: string, days: number): string {
  return iso(new Date(utc(date).getTime() + days * DAY_MS));
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((utc(to).getTime() - utc(from).getTime()) / DAY_MS);
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function addMonths(month: string, count: number): string {
  const [year, m] = month.split("-").map(Number);
  const index = year * 12 + (m - 1) + count;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** Months from `from` to `to` (e.g. "2026-01" → "2026-03" is 2). */
export function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return ty * 12 + tm - (fy * 12 + fm);
}

export function firstDayOfMonth(month: string): string {
  return `${month}-01`;
}

export function lastDayOfMonth(month: string): string {
  return addDays(firstDayOfMonth(addMonths(month, 1)), -1);
}

/** Day of the week, 0 = Sunday … 6 = Saturday. */
export function weekday(date: string): number {
  return utc(date).getUTCDay();
}

/** The date as a Date at noon UTC, safe to format with Intl in any timezone. */
export function toDisplayDate(date: string): Date {
  return new Date(`${date.slice(0, 10)}T12:00:00Z`);
}
