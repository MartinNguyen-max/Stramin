"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/features/auth/current-user";
import { updatePreferences } from "./data";
import { type Settings, settingsSchema } from "./schemas";

/**
 * Saves a setting the moment it's picked (SET-1..3, owner feedback 2026-11-12: no Save button).
 * For the language it also sets next-intl's language cookie (as its own switch does), so the next
 * page load stays in the new language; the browser then reloads the app in it.
 */
export async function savePreference(
  patch: Partial<Settings>,
): Promise<{ ok: boolean }> {
  const parsed = settingsSchema.partial().safeParse(patch);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return { ok: false };
  }
  const user = await getCurrentUser();
  try {
    await updatePreferences(user, parsed.data);
  } catch (error) {
    console.error("[settings] save failed", error);
    return { ok: false };
  }
  if (parsed.data.locale) {
    (await cookies()).set("NEXT_LOCALE", parsed.data.locale, {
      path: "/",
      sameSite: "lax",
    });
  }
  // Pages kept in the browser (30 s, staleTimes) must show the new units and week start.
  refresh();
  return { ok: true };
}
