import { timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { runSyncJobs } from "@/features/strava/sync";

export const maxDuration = 60;

/** Leave room before Vercel stops the function. */
const BUDGET_MS = 45_000;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * The hourly sync job (ADR 0012), called by Supabase Cron with `Authorization: Bearer <CRON_SECRET>`.
 * Imports, refreshes and cleans up Strava data for every connection (CON-3, CON-8, NFR-4).
 */
async function run(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const report = await runSyncJobs(Date.now() + BUDGET_MS);
  console.info("[jobs] sync", JSON.stringify(report));
  return NextResponse.json(report);
}

export { run as GET, run as POST };
