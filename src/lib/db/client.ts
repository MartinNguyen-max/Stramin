import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }
  // prepare: false is required by Supabase's connection pooler (transaction mode) in production.
  const client = postgres(databaseUrl, { prepare: false });
  return drizzle({ client, schema });
}

let db: ReturnType<typeof createDb> | undefined;

/**
 * Privileged database client: bypasses Row Level Security.
 * Use it only for the job runner, webhooks and as the base for `withRls` (ADR 0003).
 * Created lazily, so importing this module never fails at build time.
 */
export function getAdminDb() {
  db ??= createDb();
  return db;
}
