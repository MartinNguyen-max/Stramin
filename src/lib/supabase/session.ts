import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { supabaseConfig } from "./config";

/**
 * Refreshes the Supabase session on every request (called from `src/proxy.ts`) and reports
 * whether a user is logged in. Refreshed cookies are written to both the request and the response.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
): Promise<{ response: NextResponse; isLoggedIn: boolean }> {
  const config = supabaseConfig();
  if (!config) {
    return { response, isLoggedIn: false };
  }

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getClaims() validates the JWT. Never trust an unvalidated session on the server.
  const { data } = await supabase.auth.getClaims();
  return { response, isLoggedIn: Boolean(data?.claims) };
}
