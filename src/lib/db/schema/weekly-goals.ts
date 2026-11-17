import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgPolicy,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

/**
 * The user's own weekly goal (owner feedback 2026-11-17): hours per week, and optionally a distance
 * OR a time per sport. Every column is optional; an empty goal is deleted instead of stored.
 * "This week" on Home compares with it; without it, with the average week of the shown period.
 * RLS: a user can only see and change their own row (PRIV-3). Deleting the user deletes it (ACC-4).
 */
export const weeklyGoals = pgTable(
  "weekly_goals",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    totalSeconds: integer("total_seconds"),
    swimMeters: integer("swim_meters"),
    swimSeconds: integer("swim_seconds"),
    bikeMeters: integer("bike_meters"),
    bikeSeconds: integer("bike_seconds"),
    runMeters: integer("run_meters"),
    runSeconds: integer("run_seconds"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // A sport has a distance or a time, never both.
    check(
      "weekly_goals_swim_one",
      sql`${table.swimMeters} is null or ${table.swimSeconds} is null`,
    ),
    check(
      "weekly_goals_bike_one",
      sql`${table.bikeMeters} is null or ${table.bikeSeconds} is null`,
    ),
    check(
      "weekly_goals_run_one",
      sql`${table.runMeters} is null or ${table.runSeconds} is null`,
    ),
    pgPolicy("weekly_goals_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("weekly_goals_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("weekly_goals_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("weekly_goals_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
).enableRLS();

export type WeeklyGoalRow = typeof weeklyGoals.$inferSelect;
