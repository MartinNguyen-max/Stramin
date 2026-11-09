import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl, STRAVA_STATE_COOKIE } from "@/lib/strava/client";

/** Only allow returning to our own pages. */
function safeNext(next: string | null): string {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/home";
}

/**
 * Starts the Strava OAuth flow. `?next=` is where the user returns afterwards (default /home).
 * SPIKE: becomes the real "Connect Strava" in M3 (tokens stored encrypted in the database).
 */
export function GET(request: NextRequest) {
  const state = randomBytes(16).toString("base64url");
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const redirectUri = `${request.nextUrl.origin}/api/strava/callback`;

  const response = NextResponse.redirect(buildAuthorizeUrl(redirectUri, state));
  response.cookies.set(STRAVA_STATE_COOKIE, JSON.stringify({ state, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/strava",
    maxAge: 600,
  });
  return response;
}
