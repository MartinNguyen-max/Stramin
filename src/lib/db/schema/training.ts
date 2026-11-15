import { sql } from "drizzle-orm";
import {
  index,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

/**
 * Favorite workouts (owner feedback 2026-11-15): catalog workouts ("intervals-400") and created ones
 * ("run.vo2.60"). Only the id is stored; the workout is built from it with the user's current paces.
 * RLS: a user can only read, add and remove their own (PRIV-3). Deleting the user deletes them (ACC-4).
 */
export const favoriteWorkouts = pgTable(
  "favorite_workouts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    workoutId: text("workout_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.workoutId] }),
    index("favorite_workouts_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
    pgPolicy("favorite_workouts_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("favorite_workouts_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("favorite_workouts_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS();

export type FavoriteWorkoutRow = typeof favoriteWorkouts.$inferSelect;
