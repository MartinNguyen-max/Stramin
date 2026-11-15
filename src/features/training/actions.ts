"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/features/auth/current-user";
import { setFavoriteRow } from "./favorites-data";
import { MAX_WORKOUT_ID_LENGTH, workoutById } from "./generator";
import { DEFAULT_PACES } from "./plan";

/** Adds a workout to the favorites or removes it (owner feedback 2026-11-15). Only real workout ids. */
export async function setFavorite(
  workoutId: string,
  favorite: boolean,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (
    typeof workoutId !== "string" ||
    workoutId.length > MAX_WORKOUT_ID_LENGTH ||
    typeof favorite !== "boolean" ||
    // Paces only change a swim's meters, not whether the id exists.
    !workoutById(workoutId, DEFAULT_PACES)
  ) {
    return { ok: false };
  }
  try {
    await setFavoriteRow(user, workoutId, favorite);
  } catch (error) {
    console.error("[training] favorite failed", error);
    return { ok: false };
  }
  refresh();
  return { ok: true };
}
