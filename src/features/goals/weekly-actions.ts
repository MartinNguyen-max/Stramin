"use server";

import { refresh } from "next/cache";
import { getLocale } from "next-intl/server";
import { getCurrentUser } from "@/features/auth/current-user";
import { getPreferences } from "@/features/profile/data";
import {
  isPlausibleMeters,
  isPlausibleSeconds,
  parseDistance,
  parseHours,
  WEEKLY_SPORTS,
  type WeeklyGoal,
  type WeeklySport,
} from "./weekly";
import { saveWeeklyGoalRow } from "./weekly-data";

export type WeeklyGoalState =
  | { status: "idle" }
  | { status: "saved" }
  | {
      status: "error";
      error: "invalid" | "outOfRange" | "unavailable";
      /** The field that is wrong: "total" or a sport. */
      field?: "total" | WeeklySport;
    };

/**
 * Saves the weekly goal (owner feedback 2026-11-17). Every field is optional; a sport's target is a
 * distance (in the user's units) or a time. Clearing every field removes the goal.
 */
export async function saveWeeklyGoal(
  _prev: WeeklyGoalState,
  formData: FormData,
): Promise<WeeklyGoalState> {
  const user = await getCurrentUser();
  const locale = (await getLocale()) as "en" | "da";
  const { units } = await getPreferences(user, locale);
  const text = (name: string) => String(formData.get(name) ?? "").trim();

  const goal: WeeklyGoal = { totalSeconds: null, sports: {} };
  const total = text("total");
  if (total) {
    const value = parseHours(total);
    if (value === null) {
      return { status: "error", error: "invalid", field: "total" };
    }
    if (!isPlausibleSeconds(value)) {
      return { status: "error", error: "outOfRange", field: "total" };
    }
    goal.totalSeconds = value;
  }

  for (const sport of WEEKLY_SPORTS) {
    const kind = text(`${sport}Kind`);
    const raw = text(`${sport}Value`);
    if ((kind !== "distance" && kind !== "time") || !raw) continue;
    if (kind === "distance") {
      const value = parseDistance(raw, units);
      if (value === null)
        return { status: "error", error: "invalid", field: sport };
      if (!isPlausibleMeters(sport, value)) {
        return { status: "error", error: "outOfRange", field: sport };
      }
      goal.sports[sport] = { meters: value };
    } else {
      const value = parseHours(raw);
      if (value === null)
        return { status: "error", error: "invalid", field: sport };
      if (!isPlausibleSeconds(value)) {
        return { status: "error", error: "outOfRange", field: sport };
      }
      goal.sports[sport] = { seconds: value };
    }
  }

  try {
    await saveWeeklyGoalRow(user, goal);
  } catch (error) {
    console.error("[weekly goal] save failed", error);
    return { status: "error", error: "unavailable" };
  }
  refresh();
  return { status: "saved" };
}
