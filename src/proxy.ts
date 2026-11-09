import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/** Sends visitors to the right language version (e.g. Danish users to `/da`). */
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next.js internals and files with an extension (e.g. favicon.ico).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
