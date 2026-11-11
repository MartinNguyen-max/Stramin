"use server";

import { supabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Marks the short introduction as seen (owner feedback 2026-11-12). Stored on the login itself
 * (Supabase user metadata, like the name), so it shows once per person, on any device, without a
 * database change.
 */
export async function completeOnboarding(): Promise<void> {
  if (!supabaseConfig()) return;
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { onboarded: true },
  });
  if (error) {
    console.error("[onboarding] could not save", error);
    return;
  }
  // The flag is read from the login token, so get a fresh one right away.
  await supabase.auth.refreshSession();
}
