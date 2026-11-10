import { after, type NextRequest, NextResponse } from "next/server";
import {
  getConnectionByAthlete,
  removeStravaConnection,
} from "@/features/strava/connection";
import { deleteStravaActivity, syncOneActivity } from "@/features/strava/sync";
import { isWebhookEvent, webhookVerifyToken } from "@/features/strava/webhook";
import { RateTracker } from "@/lib/strava/client";

export const maxDuration = 30;

/** Strava checks the subscription once: echo the challenge if the verify token matches (CON-4). */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (
    params.get("hub.mode") === "subscribe" &&
    params.get("hub.verify_token") === webhookVerifyToken()
  ) {
    return NextResponse.json({ "hub.challenge": params.get("hub.challenge") });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * New, changed and deleted activities, and deauthorizations (CON-4). Strava wants an answer within
 * 2 seconds, so the work runs after the response (ADR 0012).
 */
export async function POST(request: NextRequest) {
  let event: unknown;
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!isWebhookEvent(event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  after(async () => {
    try {
      const connection = await getConnectionByAthlete(String(event.owner_id));
      if (!connection) return;

      if (event.object_type === "athlete") {
        // The athlete revoked Stramin's access on Strava: delete their Strava data (CON-2).
        if (event.updates?.authorized === "false") {
          await removeStravaConnection(connection, { revoke: false });
        }
        return;
      }

      const activityId = String(event.object_id);
      if (event.aspect_type === "delete") {
        await deleteStravaActivity(activityId);
      } else {
        await syncOneActivity(connection, activityId, new RateTracker());
      }
    } catch (error) {
      // The daily full refresh catches anything missed here.
      console.error("[strava] webhook event failed", error);
    }
  });

  return NextResponse.json({ ok: true });
}
