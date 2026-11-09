import { type NextRequest, NextResponse } from "next/server";
import {
  exchangeCode,
  STRAVA_STATE_COOKIE,
  STRAVA_TOKEN_COOKIE,
} from "@/lib/strava/client";

/**
 * SPIKE – Strava data test.
 * Strava redirects here after consent. The access token is kept in a short-lived, httpOnly cookie
 * (no database yet), then the user is sent to the test page.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const savedState = request.cookies.get(STRAVA_STATE_COOKIE)?.value;

  if (params.get("error")) {
    return NextResponse.json(
      { ok: false, error: `Strava: ${params.get("error")}` },
      { status: 400 },
    );
  }
  if (!code || !state || state !== savedState) {
    return NextResponse.json(
      { ok: false, error: "Missing code or state mismatch. Start again." },
      { status: 400 },
    );
  }

  try {
    const tokens = await exchangeCode(code);
    const response = NextResponse.redirect(
      new URL("/strava-test", request.nextUrl.origin),
    );
    response.cookies.set(STRAVA_TOKEN_COOKIE, tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // Strava access tokens last 6 hours.
      expires: new Date(tokens.expires_at * 1000),
    });
    response.cookies.delete({ name: STRAVA_STATE_COOKIE, path: "/api/strava" });
    return response;
  } catch (error) {
    console.error("[strava-spike] callback failed", error);
    return NextResponse.json(
      { ok: false, error: "Strava connection failed. See logs." },
      { status: 502 },
    );
  }
}
