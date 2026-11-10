import { sql } from "drizzle-orm";
import {
  date,
  type ExtraConfigColumn,
  index,
  integer,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

// Relative import: drizzle-kit loads this file outside Next and may not resolve the "@/" alias.
import { EFFORT_SPORTS } from "../../analytics/best-efforts";

/** RLS policies so a user can only read and change their own rows (PRIV-3). */
function ownRowPolicies(name: string, userId: ExtraConfigColumn) {
  return [
    pgPolicy(`${name}_select_own`, {
      for: "select",
      to: authenticatedRole,
      using: sql`${userId} = ${authUid}`,
    }),
    pgPolicy(`${name}_insert_own`, {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${userId} = ${authUid}`,
    }),
    pgPolicy(`${name}_update_own`, {
      for: "update",
      to: authenticatedRole,
      using: sql`${userId} = ${authUid}`,
      withCheck: sql`${userId} = ${authUid}`,
    }),
    pgPolicy(`${name}_delete_own`, {
      for: "delete",
      to: authenticatedRole,
      using: sql`${userId} = ${authUid}`,
    }),
  ];
}

/** Goal sports: a single sport, or a whole triathlon (owner feedback 2026-11-11, G1). */
export const GOAL_SPORTS = [...EFFORT_SPORTS, "triathlon"] as const;
export type GoalSport = (typeof GOAL_SPORTS)[number];

/**
 * Performance goals (GOAL-1), e.g. 5 km in 18:00. Distances are integer meters (half marathon = 21098).
 * Triathlons store the whole race distance (113 000 or 226 000 m), the total as the target, and a
 * target per discipline in the split columns (null for single-sport goals).
 */
export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    sport: text("sport", { enum: GOAL_SPORTS }).notNull(),
    distanceM: integer("distance_m").notNull(),
    targetSeconds: integer("target_seconds").notNull(),
    swimSeconds: integer("swim_seconds"),
    bikeSeconds: integer("bike_seconds"),
    runSeconds: integer("run_seconds"),
    transitionSeconds: integer("transition_seconds"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("goals_user_idx").on(table.userId),
    ...ownRowPolicies("goals", table.userId),
  ],
);

/**
 * Best efforts entered by hand (BE-7, ADR 0011). They win over the estimates from Strava.
 * One row per user, sport and distance.
 */
export const personalBests = pgTable(
  "personal_bests",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    sport: text("sport", { enum: EFFORT_SPORTS }).notNull(),
    distanceM: integer("distance_m").notNull(),
    seconds: integer("seconds").notNull(),
    achievedOn: date("achieved_on"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.sport, table.distanceM] }),
    ...ownRowPolicies("personal_bests", table.userId),
  ],
);

export type GoalRow = typeof goals.$inferSelect;
export type PersonalBestRow = typeof personalBests.$inferSelect;
