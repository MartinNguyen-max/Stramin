import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl, STRAVA_STATE_COOKIE } from "@/lib/strava/client";

/** SPIKE – Strava data test. Starts the Strava OAuth flow. */
export function GET(request: NextRequest) {
  const state = randomBytes(16).toString("base64url");
  const redirectUri = `${request.nextUrl.origin}/api/strava/callback`;

  const response = NextResponse.redirect(buildAuthorizeUrl(redirectUri, state));
  response.cookies.set(STRAVA_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/strava",
    maxAge: 600,
  });
  return response;
}
