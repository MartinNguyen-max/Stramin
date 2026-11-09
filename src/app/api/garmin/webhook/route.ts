import { type NextRequest, NextResponse } from "next/server";

/**
 * SPIKE – Garmin connection test.
 * Garmin pushes activity data here. Garmin requires a fast 200 response, so we only log a
 * short, non-sensitive summary (no GPS, no samples) to prove that data arrives.
 * The real integration (queue + storage) replaces this.
 */
export async function POST(request: NextRequest) {
  const clientId = request.headers.get("garmin-client-id");
  if (clientId !== process.env.GARMIN_CLIENT_ID) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown[]>;

  for (const [summaryType, items] of Object.entries(body)) {
    for (const item of items as Record<string, unknown>[]) {
      const summary = (item.summary as Record<string, unknown>) ?? item;
      console.info("[garmin-spike] received", {
        summaryType,
        activityType: summary.activityType,
        startTimeInSeconds: summary.startTimeInSeconds,
        durationInSeconds: summary.durationInSeconds,
        distanceInMeters: summary.distanceInMeters,
        samples: Array.isArray(item.samples) ? item.samples.length : undefined,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
