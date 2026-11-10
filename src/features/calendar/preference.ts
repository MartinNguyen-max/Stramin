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
