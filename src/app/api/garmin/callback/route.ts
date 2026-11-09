import { type NextRequest, NextResponse } from "next/server";
import {
  exchangeCode,
  fetchPermissions,
  fetchUserId,
  PKCE_COOKIE,
} from "@/lib/garmin/oauth";

/**
 * SPIKE – Garmin connection test.
 * Garmin redirects here after consent. We exchange the code for tokens (server side),
 * fetch the Garmin user ID and permissions, and show them. Tokens are NOT stored or shown.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const saved = request.cookies.get(PKCE_COOKIE)?.value;

  if (!code || !state || !saved) {
    return NextResponse.json(
      { ok: false, error: "Missing code, state or PKCE cookie. Start again." },
      { status: 400 },
    );
  }

  const { verifier, state: savedState } = JSON.parse(saved) as {
    verifier: string;
    state: string;
  };
  if (state !== savedState) {
    return NextResponse.json(
      { ok: false, error: "State mismatch." },
      { status: 400 },
    );
  }

  try {
    const tokens = await exchangeCode(code, verifier);
    const [{ userId }, { permissions }] = await Promise.all([
      fetchUserId(tokens.access_token),
      fetchPermissions(tokens.access_token),
    ]);

    const response = NextResponse.json({
      ok: true,
      message: "Garmin connection works.",
      garminUserId: userId,
      permissions,
      accessTokenExpiresInSeconds: tokens.expires_in,
    });
    response.cookies.delete({ name: PKCE_COOKIE, path: "/api/garmin" });
    return response;
  } catch (error) {
    console.error("[garmin-spike] callback failed", error);
    return NextResponse.json(
      { ok: false, error: "Token exchange failed. See Vercel logs." },
      { status: 502 },
    );
  }
}
