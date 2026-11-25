import type { MetadataRoute } from "next";
import { LOCALE_PREFIXES, PRIVATE_PATHS, SITE_URL } from "@/lib/site";

/** robots.txt: index the public pages, keep the logged-in app out of search. */
export default function robots(): MetadataRoute.Robots {
  const disallow = Object.values(LOCALE_PREFIXES).flatMap((prefix) =>
    PRIVATE_PATHS.map((path) => `${prefix}${path}`),
  );
  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
