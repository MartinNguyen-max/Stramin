import { getLocale } from "next-intl/server";
import { cache } from "react";
import { redirect } from "@/i18n/navigation";
import type { AuthClaims } from "@/lib/db/rls";
import { supabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "./display-name";

export type CurrentUser = {
  id: string;
  email: string | undefined;
  /** What we call the user (ACC-5). Undefined for older accounts without a name. */
  name: string | undefined;
  /** Validated JWT claims, used to run database queries as this user (`withRls`). */
  claims: AuthClaims;
};

/**
 * The logged-in user, or a redirect to /login.
 * Reads the session, so it must be called inside a <Suspense> boundary (Cache Components).
 * This is the one place pages get the user from (Data Access Layer).
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const claims = supabaseConfig() ? await readClaims() : undefined;

  if (!claims?.sub) {
    redirect({ href: "/login", locale: await getLocale() });
    // redirect() throws. This line only satisfies the type checker.
    throw new Error("Not logged in");
  }

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
    name: displayName(claims.user_metadata),
    claims: claims as AuthClaims,
  };
}

/**
 * The saved login on this device, or null. Unlike `getCurrentUser` it never redirects.
 * Used by Log in to offer "Continue as …" (ACC-3). Call it inside a <Suspense> boundary.
 */
export async function getSavedLogin(): Promise<{
  name: string;
  email: string | undefined;
} | null> {
  const claims = supabaseConfig() ? await readClaims() : undefined;
  if (!claims?.sub) return null;

  const email = typeof claims.email === "string" ? claims.email : undefined;
  return { name: displayName(claims.user_metadata) ?? email ?? "", email };
}

/** Validates the session once per request, however many components ask for the user. */
const readClaims = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims;
});
