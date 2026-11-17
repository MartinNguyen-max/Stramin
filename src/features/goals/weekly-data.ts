import { eq } from "drizzle-orm";
import type { CurrentUser } from "@/features/auth/current-user";
import { withRls } from "@/lib/db/rls";
import { type WeeklyGoalRow, weeklyGoals } from "@/lib/db/schema";
import { isEmptyGoal, type WeeklyGoal, type WeeklyTarget } from "./weekly";

function target(
  meters: number | null,
  seconds: number | null,
): WeeklyTarget | undefined {
  if (meters !== null) return { meters };
  if (seconds !== null) return { seconds };
  return undefined;
}

function toGoal(row: WeeklyGoalRow): WeeklyGoal {
  const sports: WeeklyGoal["sports"] = {};
  const swim = target(row.swimMeters, row.swimSeconds);
  const bike = target(row.bikeMeters, row.bikeSeconds);
  const run = target(row.runMeters, row.runSeconds);
  if (swim) sports.swim = swim;
  if (bike) sports.bike = bike;
  if (run) sports.run = run;
  return { totalSeconds: row.totalSeconds, sports };
}

/** The user's weekly goal, or null when they have none. Runs as the user (RLS). */
export async function getWeeklyGoal(
  user: CurrentUser,
): Promise<WeeklyGoal | null> {
  const [row] = await withRls(user.claims, (tx) =>
    tx.select().from(weeklyGoals).where(eq(weeklyGoals.userId, user.id)),
  );
  return row ? toGoal(row) : null;
}

/** Like `getWeeklyGoal`, but null when the table isn't there yet (before the migration). */
export async function getWeeklyGoalSafe(
  user: CurrentUser,
): Promise<WeeklyGoal | null> {
  try {
    return await getWeeklyGoal(user);
  } catch (error) {
    console.error("[weekly goal] unavailable", error);
    return null;
  }
}

const meters = (t?: WeeklyTarget) => (t && "meters" in t ? t.meters : null);
const seconds = (t?: WeeklyTarget) => (t && "seconds" in t ? t.seconds : null);

/** Saves the goal; an empty goal deletes the row. */
export async function saveWeeklyGoalRow(
  user: CurrentUser,
  goal: WeeklyGoal,
): Promise<void> {
  if (isEmptyGoal(goal)) {
    await withRls(user.claims, (tx) =>
      tx.delete(weeklyGoals).where(eq(weeklyGoals.userId, user.id)),
    );
    return;
  }
  const values = {
    totalSeconds: goal.totalSeconds,
    swimMeters: meters(goal.sports.swim),
    swimSeconds: seconds(goal.sports.swim),
    bikeMeters: meters(goal.sports.bike),
    bikeSeconds: seconds(goal.sports.bike),
    runMeters: meters(goal.sports.run),
    runSeconds: seconds(goal.sports.run),
    updatedAt: new Date(),
  };
  await withRls(user.claims, (tx) =>
    tx
      .insert(weeklyGoals)
      .values({ userId: user.id, ...values })
      .onConflictDoUpdate({ target: weeklyGoals.userId, set: values }),
  );
}
