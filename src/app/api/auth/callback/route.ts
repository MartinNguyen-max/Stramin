import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Only allow redirects to our own pages. */
function safeNext(next: string | null): string {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/home";
}

/**
 * Where Supabase sends users back to after:
 * - confirming their email or resetting their password (`code`, or `token_hash` + `type`),
 * - logging in with Google (`code`).
 * Exchanges it for a session cookie, then continues to `next`.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"));
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Missing code or token") };

  if (error) {
    console.warn("[auth] callback failed", error.message);
    return NextResponse.redirect(new URL("/login?error=link", request.url));
  }
  return NextResponse.redirect(new URL(next, request.url));
}
