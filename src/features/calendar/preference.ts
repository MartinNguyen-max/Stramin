import {
  CALENDAR_VIEWS,
  type CalendarRequest,
  type CalendarView,
} from "@/lib/analytics/calendar";
import { isValidDate } from "@/lib/dates";

/**
 * The calendar's period type is remembered per device in a cookie (HOME-8, ARCHITECTURE: small per-device
 * preferences). It's a plain view setting, so it's written from the browser and read on the server.
 * This file has no server-only imports, so both sides can use it.
 */
export const CALENDAR_COOKIE = "stramin-calendar";
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

/** What is stored: the view, plus the dates for a custom period. Never the month (that defaults to "now"). */
export function preferenceValue(request: CalendarRequest): string {
  const value: CalendarRequest =
    request.view === "custom"
      ? { view: "custom", from: request.from, to: request.to }
      : { view: request.view };
  return JSON.stringify(value);
}

/** Reads the stored preference. Anything unexpected is ignored. */
export function parsePreference(
  raw: string | undefined,
): CalendarRequest | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<CalendarRequest>;
    if (
      !value.view ||
      !(CALENDAR_VIEWS as readonly string[]).includes(value.view)
    ) {
      return null;
    }
    const view = value.view as CalendarView;
    if (view === "custom") {
      if (
        typeof value.from === "string" &&
        typeof value.to === "string" &&
        isValidDate(value.from) &&
        isValidDate(value.to)
      ) {
        return { view, from: value.from, to: value.to };
      }
      return null;
    }
    return { view };
  } catch {
    return null;
  }
}

/** Saves the preference from the browser. */
export function savePreference(request: CalendarRequest): void {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  // biome-ignore lint/suspicious/noDocumentCookie: a plain, non-sensitive view setting; the Cookie Store API isn't in Safari yet.
  document.cookie = `${CALENDAR_COOKIE}=${encodeURIComponent(preferenceValue(request))}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax${secure}`;
}

/**
 * Whether the "This week" card is open, per period type (owner feedback 2026-11-15). Open by default
 * on 1M and 3M, closed on longer periods; the user's own choice per period type wins. Per device, like
 * the period type.
 */
export const THIS_WEEK_COOKIE = "stramin-this-week";
type ThisWeekChoices = Partial<Record<CalendarView, boolean>>;

const OPEN_BY_DEFAULT: readonly CalendarView[] = ["1m", "3m"];

/** Reads the stored choices. Anything unexpected is ignored. */
export function parseThisWeekChoices(raw: string | undefined): ThisWeekChoices {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    const choices: ThisWeekChoices = {};
    for (const view of CALENDAR_VIEWS) {
      if (typeof value[view] === "boolean") choices[view] = value[view];
    }
    return choices;
  } catch {
    return {};
  }
}

/** Open or closed for this period type: the user's choice, else the default. */
export function thisWeekOpen(
  choices: ThisWeekChoices,
  view: CalendarView,
): boolean {
  return choices[view] ?? OPEN_BY_DEFAULT.includes(view);
}

/** Remembers the user's choice for one period type (from the browser). */
export function saveThisWeekChoice(view: CalendarView, open: boolean): void {
  const raw = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${THIS_WEEK_COOKIE}=`))
    ?.slice(THIS_WEEK_COOKIE.length + 1);
  let decoded: string | undefined;
  try {
    decoded = raw ? decodeURIComponent(raw) : undefined;
  } catch {
    decoded = undefined;
  }
  const choices = { ...parseThisWeekChoices(decoded), [view]: open };
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  // biome-ignore lint/suspicious/noDocumentCookie: a plain, non-sensitive view setting; the Cookie Store API isn't in Safari yet.
  document.cookie = `${THIS_WEEK_COOKIE}=${encodeURIComponent(JSON.stringify(choices))}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax${secure}`;
}
