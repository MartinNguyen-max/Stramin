import type { MetadataRoute } from "next";
import { LOCALE_PREFIXES, PUBLIC_PATHS, SITE_URL } from "@/lib/site";

/** sitemap.xml: every public page in every language, with links between the languages. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.flatMap((path) => {
    const languages = Object.fromEntries(
      Object.entries(LOCALE_PREFIXES).map(([locale, prefix]) => [
        locale,
        `${SITE_URL}${prefix}${path}`,
      ]),
    );
    return Object.values(languages).map((url) => ({
      url,
      alternates: { languages },
    }));
  });
}
