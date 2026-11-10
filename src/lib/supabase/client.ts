import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "./config";

/**
 * Supabase client for the browser. Uses the logged-in user's session cookies, so Row Level Security
 * applies. Only used where the browser must talk to Supabase directly (uploading event images, EVT-2).
 */
export function createBrowserSupabase() {
  const config = supabaseConfig();
  if (!config) {
    throw new Error("Supabase is not configured.");
  }
  return createBrowserClient(config.url, config.key);
}
