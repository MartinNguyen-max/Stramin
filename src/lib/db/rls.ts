import { sql } from "drizzle-orm";
import { getAdminDb } from "./client";

/** The validated JWT claims of the current user (from `supabase.auth.getClaims()`). */
export type AuthClaims = { sub: string; role?: string; [key: string]: unknown };

type Transaction = Parameters<
  Parameters<ReturnType<typeof getAdminDb>["transaction"]>[0]
>[0];

/**
 * Runs `fn` in a transaction as the logged-in user, so Postgres Row Level Security applies (PRIV-3, ADR 0003).
 * The claims are set the same way Supabase's own API does, so `auth.uid()` works in RLS policies.
 * Always use this for user requests. Never query user data with the admin client.
 */
export async function withRls<T>(
  claims: AuthClaims,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return getAdminDb().transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`,
    );
    await tx.execute(
      sql`select set_config('request.jwt.claim.sub', ${claims.sub}, true)`,
    );
    await tx.execute(sql`set local role authenticated`);
    return fn(tx);
  });
}
