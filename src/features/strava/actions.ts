"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/features/auth/current-user";
import { RateTracker } from "@/lib/strava/client";
import { getStravaConnection, removeStravaConnection } from "./connection";
import { quickSync, syncAll } from "./sync";

/** The Refresh button can't hammer Strava (NFR-4). */
const MIN_REFRESH_INTERVAL_MS = 60_000;

export type StravaActionState =
  | { status: "idle" }
  | { status: "done" }
  | { status: "error"; error: "notConnected" | "tooSoon" | "failed" };

/** Refresh button (CON-5): a quick sync, or the import if it isn't finished. */
export async function refreshStrava(
  _prev: StravaActionState,
): Promise<StravaActionState> {
  const user = await getCurrentUser();
  const connection = await getStravaConnection(user.id);
  if (!connection) return { status: "error", error: "notConnected" };
  if (
    connection.importState === "done" &&
    connection.lastSyncAt &&
    Date.now() - connection.lastSyncAt.getTime() < MIN_REFRESH_INTERVAL_MS
  ) {
    return { status: "error", error: "tooSoon" };
  }
  try {
    if (connection.importState === "done") {
      await quickSync(connection, new RateTracker());
    } else {
      await syncAll(connection, new RateTracker(), { isImport: true });
    }
  } catch (error) {
    console.error("[strava] refresh failed", error);
    return { status: "error", error: "failed" };
  }
  refresh();
  return { status: "done" };
}

/** Disconnect (CON-2): revoke access on Strava and delete all Strava data. */
export async function disconnectStrava(
  _prev: StravaActionState,
): Promise<StravaActionState> {
  const user = await getCurrentUser();
  const connection = await getStravaConnection(user.id);
  if (!connection) return { status: "error", error: "notConnected" };
  try {
    await removeStravaConnection(connection, { revoke: true });
  } catch (error) {
    console.error("[strava] disconnect failed", error);
    return { status: "error", error: "failed" };
  }
  refresh();
  return { status: "done" };
}
