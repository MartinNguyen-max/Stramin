import { sql } from "drizzle-orm";
import { pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

// Relative import: drizzle-kit loads this file outside Next and may not resolve the "@/" alias.
import { LOCALES, UNITS, WEEK_STARTS } from "../../preferences";

/**
 * One row per user with their preferences (SET-1..3). 1:1 with `auth.users`.
 * RLS: a user can only read, create and update their own row (PRIV-3).
 * Deleting the auth user deletes the profile (ACC-4).
 */
export const profiles = pgTable(
  "profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    units: text("units", { enum: UNITS }).notNull().default("metric"),
    weekStart: text("week_start", { enum: WEEK_STARTS })
      .notNull()
      .default("monday"),
    locale: text("locale", { enum: LOCALES }).notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    pgPolicy("profiles_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("profiles_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("profiles_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

export type Profile = typeof profiles.$inferSelect;
