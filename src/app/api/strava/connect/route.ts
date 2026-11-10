import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl, STRAVA_STATE_COOKIE } from "@/lib/strava/client";
import { supabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/** Only allow returning to our own pages. */
function safeNext(next: string | null): string {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/home";
}

/**
 * Starts "Connect with Strava" (CON-1). Only for logged-in users: the connection belongs to their account.
 * `?next=` is where the user returns afterwards (default /home).
 */
export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const { data } = supabaseConfig()
    ? await (await createClient()).auth.getClaims()
    : { data: null };
  if (!data?.claims?.sub) {
    return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
  }

  const state = randomBytes(16).toString("base64url");
  const redirectUri = `${request.nextUrl.origin}/api/strava/callback`;
  const response = NextResponse.redirect(buildAuthorizeUrl(redirectUri, state));
  response.cookies.set(
    STRAVA_STATE_COOKIE,
    JSON.stringify({ state, next, user: data.claims.sub }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/strava",
      maxAge: 600,
    },
  );
  return response;
}
