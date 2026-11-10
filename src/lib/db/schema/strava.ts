import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

// Relative import: drizzle-kit loads this file outside Next and may not resolve the "@/" alias.
import { SPORTS } from "../../analytics/sports";

export const PROVIDERS = ["strava", "garmin"] as const;
export const IMPORT_STATES = ["pending", "running", "done", "failed"] as const;

/**
 * A user's link to Strava (later Garmin), CON-1, CON-6. Tokens are encrypted (PRIV-4).
 * RLS is on with NO policies and NO grants for users: only the server reads it, always by user id.
 */
export const connections = pgTable(
  "connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: PROVIDERS }).notNull(),
    providerAthleteId: text("provider_athlete_id").notNull(),
    /** For "Connected as …" in Settings. */
    athleteName: text("athlete_name"),
    accessTokenEnc: text("access_token_enc").notNull(),
    refreshTokenEnc: text("refresh_token_enc").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    scopes: text("scopes").notNull(),
    importState: text("import_state", { enum: IMPORT_STATES })
      .notNull()
      .default("pending"),
    importedCount: integer("imported_count").notNull().default(0),
    lastFullSyncAt: timestamp("last_full_sync_at", { withTimezone: true }),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("connections_user_provider_idx").on(
      table.userId,
      table.provider,
    ),
    uniqueIndex("connections_provider_athlete_idx").on(
      table.provider,
      table.providerAthleteId,
    ),
  ],
).enableRLS();

/**
 * Activity summaries (SPT-1..3), synced from Strava (CON-3, CON-4) and kept fresh within 7 days (CON-8).
 * Users can only read their own rows; only the server writes.
 */
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: PROVIDERS }).notNull(),
    providerActivityId: text("provider_activity_id").notNull(),
    name: text("name").notNull(),
    sport: text("sport", { enum: SPORTS }).notNull(),
    /** The provider's own type, e.g. Strava's "VirtualRide". */
    sportType: text("sport_type").notNull(),
    isIndoor: boolean("is_indoor").notNull().default(false),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    /** Local start time as the provider gives it, e.g. "2026-11-02T07:15:00Z" (the athlete's wall clock). */
    startLocal: text("start_local").notNull(),
    movingSeconds: integer("moving_seconds").notNull(),
    elapsedSeconds: integer("elapsed_seconds").notNull(),
    distanceM: real("distance_m").notNull().default(0),
    elevationM: real("elevation_m"),
    /** Rides with a power meter (Strava: device_watts). */
    avgWatts: real("avg_watts"),
    weightedAvgWatts: real("weighted_avg_watts"),
    deviceWatts: boolean("device_watts").notNull().default(false),
    /**
     * Exact best efforts from the provider's detailed activity (runs, BE-1): [{ distance, seconds }].
     * Only for the few runs that could hold a record (ADR 0013).
     */
    bestEfforts:
      jsonb("best_efforts").$type<{ distance: number; seconds: number }[]>(),
    /** Best average power per duration in seconds, from the power stream (rides, BE-3): { "1200": 285 }. */
    powerBests: jsonb("power_bests").$type<Record<string, number>>(),
    /** When best_efforts / power_bests were last fetched (also kept within 7 days, ADR 0009). */
    detailsFetchedAt: timestamp("details_fetched_at", { withTimezone: true }),
    /** When the data was last fetched from the provider (rolling 7-day cache, ADR 0009). */
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("activities_provider_activity_idx").on(
      table.provider,
      table.providerActivityId,
    ),
    index("activities_user_start_idx").on(table.userId, table.startLocal),
    pgPolicy("activities_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

export type ConnectionRow = typeof connections.$inferSelect;
export type ActivityRow = typeof activities.$inferSelect;
