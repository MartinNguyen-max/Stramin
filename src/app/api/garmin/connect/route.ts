import { NextResponse } from "next/server";
import { buildAuthorizeUrl, createPkce, PKCE_COOKIE } from "@/lib/garmin/oauth";

/**
 * SPIKE – Garmin connection test.
 * Starts the OAuth flow: stores the PKCE verifier + state in a short-lived, httpOnly cookie
 * and sends the user to Garmin's consent page.
 */
export function GET() {
  const { verifier, challenge, state } = createPkce();

  const response = NextResponse.redirect(buildAuthorizeUrl(challenge, state));
  response.cookies.set(PKCE_COOKIE, JSON.stringify({ verifier, state }), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/garmin",
    maxAge: 600,
  });
  return response;
}
