import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * The page's language, sent as a hidden form field.
 * Server Actions can't read the `[locale]` route segment (next/root-params), so forms send it along.
 */
export function localeFromForm(formData: FormData, field = "locale") {
  const value = formData.get(field);
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}
