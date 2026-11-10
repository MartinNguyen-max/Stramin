import { after, type NextRequest, NextResponse } from "next/server";
import {
  AthleteTakenError,
  saveStravaConnection,
} from "@/features/strava/connection";
import { fetchDetails } from "@/features/strava/details";
import { syncAll } from "@/features/strava/sync";
import {
  exchangeCode,
  RateTracker,
  REQUIRED_SCOPE,
  STRAVA_STATE_COOKIE,
} from "@/lib/strava/client";
import { supabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/** The history import may continue after the response, so give it time. */
export const maxDuration = 60;

/** How long the user waits for the import before Home opens. */
const IMPORT_WAIT_MS = 8000;

/**
 * Strava redirects here after the user approved (CON-1). Stores the encrypted tokens, sends the user on
 * at once and imports the history in the background (CON-3, ADR 0012).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const origin = request.nextUrl.origin;

  let saved: { state?: string; next?: string; user?: string } = {};
  try {
    saved = JSON.parse(request.cookies.get(STRAVA_STATE_COOKIE)?.value ?? "{}");
  } catch {
    // Invalid cookie: handled as a state mismatch below.
  }
  const next = saved.next ?? "/home";
  const fail = (reason: string) => {
    const url = new URL(next, origin);
    url.searchParams.set("strava", reason);
    const response = NextResponse.redirect(url);
    response.cookies.delete({ name: STRAVA_STATE_COOKIE, path: "/api/strava" });
    return response;
  };

  // The user pressed "Cancel" on Strava.
  if (params.get("error")) return fail("denied");

  const code = params.get("code");
  if (!code || !params.get("state") || params.get("state") !== saved.state) {
    return fail("failed");
  }
  // Stramin can only work with access to all activities.
  const scopes = params.get("scope") ?? "";
  if (!scopes.split(",").includes(REQUIRED_SCOPE)) return fail("scope");

  // The same user that started the connection must still be logged in.
  const { data } = supabaseConfig()
    ? await (await createClient()).auth.getClaims()
    : { data: null };
  const userId = data?.claims?.sub;
  if (!userId || userId !== saved.user) return fail("failed");

  try {
    const tokens = await exchangeCode(code);
    const connection = await saveStravaConnection(userId, tokens, scopes);
    const importing = syncAll(connection, new RateTracker(), {
      isImport: true,
    }).catch((error) => {
      // The hourly job retries an unfinished import.
      console.error("[strava] import failed", error);
    });
    // Wait a few seconds, so Home opens with the workouts already there (owner feedback H3).
    // A long history continues in the background.
    const done = await Promise.race([
      importing.then(() => true),
      new Promise<false>((resolve) =>
        setTimeout(() => resolve(false), IMPORT_WAIT_MS),
      ),
    ]);
    // Then (or while Home is already open) fetch Strava's exact best efforts and power (ADR 0013).
    after(async () => {
      await importing;
      try {
        await fetchDetails(connection, new RateTracker(), 15);
      } catch (error) {
        console.error("[strava] details failed", error);
      }
    });
  } catch (error) {
    if (error instanceof AthleteTakenError) return fail("taken");
    console.error("[strava] callback failed", error);
    return fail("failed");
  }

  const response = NextResponse.redirect(new URL(next, origin));
  response.cookies.delete({ name: STRAVA_STATE_COOKIE, path: "/api/strava" });
  return response;
}
