import { sql } from "drizzle-orm";
import {
  date,
  index,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

// Relative import: drizzle-kit loads this file outside Next and may not resolve the "@/" alias.
import { EVENT_TYPES } from "../../../features/events/types";

/**
 * Events to count down to (EVT-1..4), e.g. "Ironman Copenhagen".
 * RLS: a user can only read and change their own events (PRIV-3). Deleting the user deletes them (ACC-4).
 */
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    eventDate: date("event_date").notNull(),
    type: text("type", { enum: EVENT_TYPES }).notNull().default("triathlon"),
    /** Path in the private `event-images` bucket, or null for the default background (EVT-2). */
    imagePath: text("image_path"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("events_user_date_idx").on(table.userId, table.eventDate),
    pgPolicy("events_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("events_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("events_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("events_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

export type EventRow = typeof events.$inferSelect;
