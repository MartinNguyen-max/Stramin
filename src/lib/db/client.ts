import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }
  const client = postgres(databaseUrl, {
    // Required by Supabase's connection pooler (transaction mode) in production.
    prepare: false,
    // Serverless functions are reused between requests. Close idle connections before the pooler does,
    // so a request never picks up a connection that was cut while the function was idle.
    idle_timeout: 20,
    max_lifetime: 60 * 10,
    connect_timeout: 10,
  });
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

/** Errors that mean "the connection broke", not "the query is wrong". Safe to try once more. */
const CONNECTION_ERRORS = new Set([
  "CONNECTION_CLOSED",
  "CONNECTION_ENDED",
  "CONNECTION_DESTROYED",
  "CONNECT_TIMEOUT",
  "ECONNRESET",
  "EPIPE",
  "ETIMEDOUT",
]);

export function isConnectionError(error: unknown): boolean {
  for (let current = error; current; ) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && CONNECTION_ERRORS.has(code)) return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

/** Runs a read again once when the connection broke (owner feedback H11). Only for idempotent work. */
export async function retryOnConnectionError<T>(
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    console.warn("[db] connection error, trying once more", error);
    return fn();
  }
}
