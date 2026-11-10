import { and, asc, eq } from "drizzle-orm";
import type { CurrentUser } from "@/features/auth/current-user";
import type { EffortSport } from "@/lib/analytics/best-efforts";
import { withRls } from "@/lib/db/rls";
import { goals } from "@/lib/db/schema";

export type Goal = {
  id: string;
  sport: EffortSport;
  /** Integer meters (distanceKey). */
  distance: number;
  target: number;
};

/** The user's goals, oldest first (GOAL-1). Runs as the user (RLS). */
export async function listGoals(user: CurrentUser): Promise<Goal[]> {
  const rows = await withRls(user.claims, (tx) =>
    tx
      .select()
      .from(goals)
      .where(eq(goals.userId, user.id))
      .orderBy(asc(goals.createdAt)),
  );
  return rows.map((row) => ({
    id: row.id,
    sport: row.sport,
    distance: row.distanceM,
    target: row.targetSeconds,
  }));
}

export async function insertGoal(
  user: CurrentUser,
  goal: Omit<Goal, "id">,
): Promise<void> {
  await withRls(user.claims, (tx) =>
    tx.insert(goals).values({
      userId: user.id,
      sport: goal.sport,
      distanceM: goal.distance,
      targetSeconds: Math.round(goal.target),
    }),
  );
}

export async function deleteGoalRow(
  user: CurrentUser,
  id: string,
): Promise<void> {
  await withRls(user.claims, (tx) =>
    tx.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, user.id))),
  );
}
