import { defineRouting } from "next-intl/routing";

/**
 * Languages and URL strategy (ARCHITECTURE: Internationalization).
 * English is the default and has no URL prefix: `/home` = English, `/da/home` = Danish.
 */
export const routing = defineRouting({
  locales: ["en", "da"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});
