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

/** Performance goals (GOAL-1), e.g. 5 km in 18:00. Distances are integer meters (half marathon = 21098). */
export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    sport: text("sport", { enum: EFFORT_SPORTS }).notNull(),
    distanceM: integer("distance_m").notNull(),
    targetSeconds: integer("target_seconds").notNull(),
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
