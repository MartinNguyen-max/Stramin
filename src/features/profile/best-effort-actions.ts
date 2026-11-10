"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/current-user";
import { EFFORT_SPORTS, isEffortDistance } from "@/lib/analytics/best-efforts";
import { isValidDate, today } from "@/lib/dates";
import { parseClock } from "@/lib/format";
import { deleteManualEffort, saveManualEffort } from "./best-efforts-data";

/** A best effort can't be longer than two days (catches typos like "1950" for 19:50 → still allowed as seconds). */
const MAX_SECONDS = 48 * 3600;

export type EffortFormState =
  | { status: "idle" }
  | { status: "saved" }
  | {
      status: "error";
      error: "timeInvalid" | "dateInvalid" | "unavailable" | "generic";
    };

const keySchema = z.object({
  sport: z.enum(EFFORT_SPORTS),
  distance: z.coerce.number().int().positive(),
});

/** Saves a manual best effort (BE-7). */
export async function saveBestEffort(
  _prev: EffortFormState,
  formData: FormData,
): Promise<EffortFormState> {
  const user = await getCurrentUser();
  const key = keySchema.safeParse({
    sport: formData.get("sport"),
    distance: formData.get("distance"),
  });
  if (!key.success || !isEffortDistance(key.data.sport, key.data.distance)) {
    return { status: "error", error: "generic" };
  }
  const seconds = parseClock(String(formData.get("time") ?? ""));
  if (!seconds || seconds > MAX_SECONDS) {
    return { status: "error", error: "timeInvalid" };
  }
  const rawDate = String(formData.get("date") ?? "");
  if (rawDate && (!isValidDate(rawDate) || rawDate > today())) {
    return { status: "error", error: "dateInvalid" };
  }

  try {
    await saveManualEffort(user, {
      ...key.data,
      seconds,
      date: rawDate || null,
    });
  } catch (error) {
    console.error("[best efforts] save failed", error);
    return { status: "error", error: "unavailable" };
  }
  refresh();
  return { status: "saved" };
}

/** Removes a manual value, so the Strava estimate is used again (BE-7). */
export async function resetBestEffort(
  _prev: EffortFormState,
  formData: FormData,
): Promise<EffortFormState> {
  const user = await getCurrentUser();
  const key = keySchema.safeParse({
    sport: formData.get("sport"),
    distance: formData.get("distance"),
  });
  if (!key.success) return { status: "error", error: "generic" };
  try {
    await deleteManualEffort(user, key.data.sport, key.data.distance);
  } catch (error) {
    console.error("[best efforts] reset failed", error);
    return { status: "error", error: "unavailable" };
  }
  refresh();
  return { status: "saved" };
}
