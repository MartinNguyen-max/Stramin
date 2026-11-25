/** The public address of Stramin. Used for sitemap, robots and social links. */
export const SITE_URL = "https://stramin.mmaxlab.com";

/** Languages with their URL prefix (English has none, see i18n/routing.ts). */
export const LOCALE_PREFIXES = { en: "", da: "/da" } as const;

/** Public pages that search engines may index (without the locale prefix). */
export const PUBLIC_PATHS = ["", "/demo", "/guide", "/privacy"] as const;

/** Pages behind login. Search engines should not crawl them. */
export const PRIVATE_PATHS = [
  "/home",
  "/training",
  "/goals",
  "/profile",
  "/settings",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api",
] as const;

/**
 * The canonical address and the language versions of one public page (`path` is "" for home).
 * Each page sets its own, so Google never mixes up the pages or the languages.
 */
export function pageAlternates(
  locale: string,
  path: string,
): { canonical: string; languages: Record<string, string> } {
  const url = (lang: keyof typeof LOCALE_PREFIXES) =>
    `${SITE_URL}${LOCALE_PREFIXES[lang]}${path}`;
  const languages = { en: url("en"), da: url("da") };
  const current = locale === "da" ? "da" : "en";
  return {
    canonical: url(current),
    languages: { ...languages, "x-default": languages.en },
  };
}
