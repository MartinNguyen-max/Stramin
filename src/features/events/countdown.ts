import { useSyncExternalStore } from "react";
import { daysBetween } from "@/lib/dates";

/** Days from today until the event (0 = today, negative = past). */
export function daysUntil(eventDate: string, todayDate: string): number {
  return daysBetween(todayDate, eventDate);
}

/** Today in the browser's own timezone, "YYYY-MM-DD". */
export function localToday(now: Date = new Date()): string {
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

const noSubscription = () => () => {};

/**
 * Today's date for countdowns: the server's date while rendering on the server and hydrating,
 * then the browser's local date (the user's own midnight, not the server's).
 */
export function useLocalToday(serverToday: string): string {
  return useSyncExternalStore(
    noSubscription,
    () => localToday(),
    () => serverToday,
  );
}
