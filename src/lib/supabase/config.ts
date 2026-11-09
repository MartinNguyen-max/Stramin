/**
 * Supabase connection settings. Returns null when Supabase isn't configured (e.g. in CI or before the
 * cloud project exists), so the public pages keep working and auth simply treats everyone as logged out.
 */
export function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

/** Google login is only shown when it has been set up in Supabase (ADR 0004). */
export const isGoogleAuthEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
