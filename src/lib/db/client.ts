import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. See .env.example.");
}

// prepare: false is required by Supabase's connection pooler (transaction mode) in production.
const client = postgres(databaseUrl, { prepare: false });

/**
 * Privileged database client: bypasses Row Level Security.
 * Only for the job runner and webhooks. User requests get an RLS-aware client in M2 (ADR 0003).
 */
export const adminDb = drizzle({ client, schema });
