import { and, eq } from "drizzle-orm";
import { decryptToken, encryptToken } from "@/lib/crypto/tokens";
import { getAdminDb, retryOnConnectionError } from "@/lib/db/client";
import { activities, type ConnectionRow, connections } from "@/lib/db/schema";
import {
  deauthorize,
  refreshAccessToken,
  type StravaTokenResponse,
} from "@/lib/strava/client";

/**
 * Stored Strava connections (CON-1, CON-2, PRIV-4). Server only: uses the admin database connection,
 * so every function filters by user id or athlete id itself. Tokens never leave this module unencrypted,
 * except to call Strava.
 */

/** Refresh the access token when it expires within this margin. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export class AthleteTakenError extends Error {
  constructor() {
    super("This Strava athlete is already connected to another account");
    this.name = "AthleteTakenError";
  }
}

export async function getStravaConnection(
  userId: string,
): Promise<ConnectionRow | undefined> {
  const [row] = await retryOnConnectionError(() =>
    getAdminDb()
      .select()
      .from(connections)
      .where(
        and(eq(connections.userId, userId), eq(connections.provider, "strava")),
      ),
  );
  return row;
}

export async function getConnectionByAthlete(
  athleteId: string,
): Promise<ConnectionRow | undefined> {
  const [row] = await getAdminDb()
    .select()
    .from(connections)
    .where(
      and(
        eq(connections.provider, "strava"),
        eq(connections.providerAthleteId, athleteId),
      ),
    );
  return row;
}

export async function listStravaConnections(): Promise<ConnectionRow[]> {
  return getAdminDb()
    .select()
    .from(connections)
    .where(eq(connections.provider, "strava"));
}

/** Saves (or replaces) the user's Strava connection after OAuth. Starts a new import. */
export async function saveStravaConnection(
  userId: string,
  tokens: StravaTokenResponse,
  scopes: string,
): Promise<ConnectionRow> {
  const athleteId = String(tokens.athlete?.id ?? "");
  if (!athleteId) throw new Error("Strava didn't return the athlete");

  const other = await getConnectionByAthlete(athleteId);
  if (other && other.userId !== userId) throw new AthleteTakenError();

  const athleteName =
    [tokens.athlete?.firstname, tokens.athlete?.lastname]
      .filter(Boolean)
      .join(" ") || null;
  const values = {
    providerAthleteId: athleteId,
    athleteName,
    accessTokenEnc: encryptToken(tokens.access_token),
    refreshTokenEnc: encryptToken(tokens.refresh_token),
    expiresAt: new Date(tokens.expires_at * 1000),
    scopes,
    importState: "pending" as const,
    importedCount: 0,
    lastError: null,
  };
  const [row] = await getAdminDb()
    .insert(connections)
    .values({ userId, provider: "strava", ...values })
    .onConflictDoUpdate({
      target: [connections.userId, connections.provider],
      set: values,
    })
    .returning();
  return row;
}

export async function updateConnection(
  id: string,
  fields: Partial<
    Pick<
      ConnectionRow,
      | "importState"
      | "importedCount"
      | "lastFullSyncAt"
      | "lastSyncAt"
      | "lastError"
    >
  >,
): Promise<void> {
  await getAdminDb()
    .update(connections)
    .set(fields)
    .where(eq(connections.id, id));
}

/**
 * A valid access token for the connection, refreshed when it's (nearly) expired.
 * The row is locked while refreshing, so two requests don't refresh at the same time.
 */
export async function accessTokenFor(
  connection: ConnectionRow,
): Promise<string> {
  if (connection.expiresAt.getTime() - Date.now() > REFRESH_MARGIN_MS) {
    return decryptToken(connection.accessTokenEnc);
  }
  return getAdminDb().transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(connections)
      .where(eq(connections.id, connection.id))
      .for("update");
    if (!current) throw new Error("Connection is gone");
    if (current.expiresAt.getTime() - Date.now() > REFRESH_MARGIN_MS) {
      return decryptToken(current.accessTokenEnc);
    }
    const tokens = await refreshAccessToken(
      decryptToken(current.refreshTokenEnc),
    );
    await tx
      .update(connections)
      .set({
        accessTokenEnc: encryptToken(tokens.access_token),
        refreshTokenEnc: encryptToken(tokens.refresh_token),
        expiresAt: new Date(tokens.expires_at * 1000),
      })
      .where(eq(connections.id, connection.id));
    return tokens.access_token;
  });
}

/**
 * Removes the connection and all its Strava activities (CON-2).
 * With `revoke`, Stramin's access on Strava is revoked first (not when Strava told us the user already did).
 */
export async function removeStravaConnection(
  connection: ConnectionRow,
  { revoke }: { revoke: boolean },
): Promise<void> {
  if (revoke) {
    try {
      await deauthorize(await accessTokenFor(connection));
    } catch (error) {
      console.warn("[strava] deauthorize failed; deleting anyway", error);
    }
  }
  await getAdminDb().transaction(async (tx) => {
    await tx
      .delete(activities)
      .where(
        and(
          eq(activities.userId, connection.userId),
          eq(activities.provider, "strava"),
        ),
      );
    await tx.delete(connections).where(eq(connections.id, connection.id));
  });
}
