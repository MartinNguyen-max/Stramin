import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/session";

const handleI18n = createMiddleware(routing);

/** Pages that require login (the app). */
const PROTECTED_PATHS = ["/home", "/settings"];
/** Pages only for logged-out visitors. Logged-in users are sent to /home. */
const GUEST_ONLY_PATHS = ["/login", "/signup"];

function matches(pathname: string, paths: string[]) {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** Splits "/da/home" into { prefix: "/da", path: "/home" }. English has no prefix. */
function splitLocale(pathname: string) {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return {
        prefix: `/${locale}`,
        path: pathname.slice(locale.length + 1) || "/",
      };
    }
  }
  return { prefix: "", path: pathname };
}

/**
 * Runs on every page request:
 * 1. Picks the language (next-intl).
 * 2. Refreshes the Supabase login session.
 * 3. Protects app pages (PRIV-3) and keeps logged-in users out of the login pages.
 */
export default async function proxy(request: NextRequest) {
  const { response, isLoggedIn } = await updateSession(
    request,
    handleI18n(request),
  );

  const { prefix, path } = splitLocale(request.nextUrl.pathname);

  if (!isLoggedIn && matches(path, PROTECTED_PATHS)) {
    return redirectWithCookies(request, response, `${prefix}/login`);
  }
  if (isLoggedIn && matches(path, GUEST_ONLY_PATHS)) {
    return redirectWithCookies(request, response, `${prefix}/home`);
  }
  return response;
}

/** Redirects while keeping any refreshed session cookies. */
function redirectWithCookies(
  request: NextRequest,
  from: NextResponse,
  pathname: string,
) {
  const redirect = NextResponse.redirect(new URL(pathname, request.url));
  for (const cookie of from.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export const config = {
  // Skip API routes, Next.js internals and files with an extension (e.g. favicon.ico).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
