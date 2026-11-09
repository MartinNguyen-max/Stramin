import { type NextRequest, NextResponse } from "next/server";
import {
  exchangeCode,
  STRAVA_STATE_COOKIE,
  STRAVA_TOKEN_COOKIE,
} from "@/lib/strava/client";

/**
 * Strava redirects here after consent.
 * SPIKE: the access token is kept in a short-lived, httpOnly cookie (no database yet).
 * M3 replaces this with encrypted tokens in the database.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");

  let saved: { state?: string; next?: string } = {};
  try {
    saved = JSON.parse(request.cookies.get(STRAVA_STATE_COOKIE)?.value ?? "{}");
  } catch {
    // Invalid cookie: handled as a state mismatch below.
  }

  if (params.get("error")) {
    return NextResponse.json(
      { ok: false, error: `Strava: ${params.get("error")}` },
      { status: 400 },
    );
  }
  if (!code || !state || state !== saved.state) {
    return NextResponse.json(
      { ok: false, error: "Missing code or state mismatch. Start again." },
      { status: 400 },
    );
  }

  try {
    const tokens = await exchangeCode(code);
    const response = NextResponse.redirect(
      new URL(saved.next ?? "/home", request.nextUrl.origin),
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
    console.error("[strava] callback failed", error);
    return NextResponse.json(
      { ok: false, error: "Strava connection failed. See logs." },
      { status: 502 },
    );
  }
}
