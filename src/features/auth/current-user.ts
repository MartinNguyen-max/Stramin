import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { AuthClaims } from "@/lib/db/rls";
import { supabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | undefined;
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
    claims: claims as AuthClaims,
  };
}

async function readClaims() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims;
}
