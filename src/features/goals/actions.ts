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
import { deleteGoalRow, insertGoal, type NewGoal } from "./data";
import { isTargetAllowed } from "./feedback";
import { LEGS, type Splits, TRIATHLON_RACES } from "./triathlon";

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

const triathlonSchema = z.object({
  sport: z.literal("triathlon"),
  race: z.enum(TRIATHLON_RACES),
  swim: z.string(),
  bike: z.string(),
  run: z.string(),
  transitions: z.string().optional(),
});

/** Reads a triathlon goal: a time per discipline, transitions optional (owner feedback G1). */
function parseTriathlon(
  formData: FormData,
): NewGoal | "generic" | "timeInvalid" {
  const parsed = triathlonSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return "generic";
  const splits: Splits = { swim: 0, bike: 0, run: 0, transitions: 0 };
  for (const leg of LEGS) {
    const seconds = parseClock(parsed.data[leg]);
    if (!seconds) return "timeInvalid";
    splits[leg] = seconds;
  }
  const transitions = parsed.data.transitions?.trim();
  if (transitions) {
    const seconds = parseClock(transitions);
    if (seconds === null) return "timeInvalid";
    splits.transitions = seconds;
  }
  return { sport: "triathlon", race: parsed.data.race, splits };
}

/**
 * Creates a goal (GOAL-1). A single-sport target must be faster than the current best (GOAL-5);
 * a triathlon has no best to compare the whole race with.
 */
export async function createGoal(
  _prev: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const user = await getCurrentUser();
  let goal: NewGoal;
  if (formData.get("sport") === "triathlon") {
    const result = parseTriathlon(formData);
    if (typeof result === "string") return { status: "error", error: result };
    goal = result;
  } else {
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
    goal = { sport, distance, target };
  }

  try {
    await insertGoal(user, goal);
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
