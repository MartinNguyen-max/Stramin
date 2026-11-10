"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/features/auth/current-user";
import { loadBestEfforts } from "@/features/profile/best-efforts-data";
import {
  EFFORT_SPORTS,
  findEffort,
  isEffortDistance,
} from "@/lib/analytics/best-efforts";
import { parseClock } from "@/lib/format";
import { deleteGoalRow, insertGoal } from "./data";
import { isTargetAllowed } from "./feedback";

export type GoalFormState =
  | { status: "idle" }
  | { status: "saved" }
  | {
      status: "error";
      error: "timeInvalid" | "notFaster" | "unavailable" | "generic";
      /** For "notFaster": the current best in seconds. */
      best?: number;
    };

const goalSchema = z.object({
  sport: z.enum(EFFORT_SPORTS),
  distance: z.coerce.number().int().positive(),
  time: z.string(),
});

/** Creates a goal (GOAL-1). The target must be faster than the current best (GOAL-5). */
export async function createGoal(
  _prev: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const user = await getCurrentUser();
  const parsed = goalSchema.safeParse(Object.fromEntries(formData));
  if (
    !parsed.success ||
    !isEffortDistance(parsed.data.sport, parsed.data.distance)
  ) {
    return { status: "error", error: "generic" };
  }
  const { sport, distance } = parsed.data;
  const target = parseClock(parsed.data.time);
  if (!target) return { status: "error", error: "timeInvalid" };

  const { efforts } = await loadBestEfforts(user);
  const best = findEffort(efforts, sport, distance)?.seconds;
  if (!isTargetAllowed(target, best)) {
    return { status: "error", error: "notFaster", best };
  }

  try {
    await insertGoal(user, { sport, distance, target });
  } catch (error) {
    console.error("[goals] save failed", error);
    return { status: "error", error: "unavailable" };
  }
  refresh();
  return { status: "saved" };
}

export async function deleteGoal(
  _prev: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const user = await getCurrentUser();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { status: "error", error: "generic" };
  try {
    await deleteGoalRow(user, id.data);
  } catch (error) {
    console.error("[goals] delete failed", error);
    return { status: "error", error: "unavailable" };
  }
  refresh();
  return { status: "saved" };
}
