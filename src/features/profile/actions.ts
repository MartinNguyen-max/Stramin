"use server";

import { getCurrentUser } from "@/features/auth/current-user";
import { localeFromForm } from "@/i18n/form-locale";
import { redirect } from "@/i18n/navigation";
import { saveSettings } from "./data";
import { type SettingsFormState, settingsSchema } from "./schemas";

/** Saves units, week start and language (SET-1..3). Switching language reloads the page in that language. */
export async function updateSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error" };
  }

  const user = await getCurrentUser();
  try {
    await saveSettings(user, parsed.data);
  } catch (error) {
    console.error("[settings] save failed", error);
    return { status: "error" };
  }

  if (parsed.data.locale !== localeFromForm(formData, "currentLocale")) {
    redirect({ href: "/settings", locale: parsed.data.locale });
  }
  return { status: "saved" };
}
