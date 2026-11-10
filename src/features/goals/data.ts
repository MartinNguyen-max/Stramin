import { and, asc, eq } from "drizzle-orm";
import type { CurrentUser } from "@/features/auth/current-user";
import type { EffortSport } from "@/lib/analytics/best-efforts";
import { withRls } from "@/lib/db/rls";
import { type GoalRow, goals } from "@/lib/db/schema";
import {
  raceForDistance,
  type Splits,
  TRIATHLONS,
  type TriathlonRace,
  totalTime,
} from "./triathlon";

/** A single-sport goal, e.g. 5 km in 18:00. */
export type SingleGoal = {
  id: string;
  sport: EffortSport;
  /** Integer meters (distanceKey). */
  distance: number;
  target: number;
};

/** A triathlon goal with a target per discipline (owner feedback 2026-11-11, G1). */
export type TriathlonGoal = {
  id: string;
  sport: "triathlon";
  race: TriathlonRace;
  /** The total, including transitions. */
  target: number;
  splits: Splits;
};

export type Goal = SingleGoal | TriathlonGoal;

type BasicRow = Pick<GoalRow, "id" | "sport" | "distanceM" | "targetSeconds"> &
  Partial<
    Pick<
      GoalRow,
      "swimSeconds" | "bikeSeconds" | "runSeconds" | "transitionSeconds"
    >
  >;

function toGoal(row: BasicRow): Goal | null {
  if (row.sport !== "triathlon") {
    return {
      id: row.id,
      sport: row.sport,
      distance: row.distanceM,
      target: row.targetSeconds,
    };
  }
  const race = raceForDistance(row.distanceM);
  if (!race || row.swimSeconds == null) return null;
  return {
    id: row.id,
    sport: "triathlon",
    race,
    target: row.targetSeconds,
    splits: {
      swim: row.swimSeconds,
      bike: row.bikeSeconds ?? 0,
      run: row.runSeconds ?? 0,
      transitions: row.transitionSeconds ?? 0,
    },
  };
}

/**
 * The user's goals, oldest first (GOAL-1). Runs as the user (RLS).
 * Without the split columns (database not updated yet) it still lists the single-sport goals.
 */
export async function listGoals(user: CurrentUser): Promise<Goal[]> {
  let rows: BasicRow[];
  try {
    rows = await withRls(user.claims, (tx) =>
      tx
        .select()
        .from(goals)
        .where(eq(goals.userId, user.id))
        .orderBy(asc(goals.createdAt)),
    );
  } catch (error) {
    console.error("[goals] full list unavailable, using basics", error);
    rows = await withRls(user.claims, (tx) =>
      tx
        .select({
          id: goals.id,
          sport: goals.sport,
          distanceM: goals.distanceM,
          targetSeconds: goals.targetSeconds,
        })
        .from(goals)
        .where(eq(goals.userId, user.id))
        .orderBy(asc(goals.createdAt)),
    );
  }
  return rows.map(toGoal).filter((goal) => goal !== null);
}

export type NewGoal =
  | Omit<SingleGoal, "id">
  | Omit<TriathlonGoal, "id" | "target">;

export async function insertGoal(
  user: CurrentUser,
  goal: NewGoal,
): Promise<void> {
  const values =
    goal.sport === "triathlon"
      ? {
          sport: goal.sport,
          distanceM: TRIATHLONS[goal.race].distance,
          targetSeconds: Math.round(totalTime(goal.splits)),
          swimSeconds: Math.round(goal.splits.swim),
          bikeSeconds: Math.round(goal.splits.bike),
          runSeconds: Math.round(goal.splits.run),
          transitionSeconds: Math.round(goal.splits.transitions),
        }
      : {
          sport: goal.sport,
          distanceM: goal.distance,
          targetSeconds: Math.round(goal.target),
        };
  await withRls(user.claims, (tx) =>
    tx.insert(goals).values({ userId: user.id, ...values }),
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
