import { Logo } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";
import { BottomNav, HeaderNav } from "./app-nav";

/**
 * Header for the logged-in app (UI_SPEC: Navigation): logo, the sections on desktop and the settings gear.
 * On phones the sections are in the bottom tab bar instead. Log out is in Settings → Account.
 */
export function AppHeader() {
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/home" className="rounded-md">
            <Logo size={28} />
          </Link>
          <HeaderNav />
        </div>
      </header>
      <BottomNav />
    </>
  );
}
