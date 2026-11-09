import { useLocale, useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { Link } from "@/i18n/navigation";

/**
 * Header for the logged-in app.
 * NOTE: the final navigation pattern (sidebar / tabs) is not decided yet (UI_SPEC). This is a simple placeholder.
 */
export function AppHeader() {
  const t = useTranslations("App");
  const locale = useLocale();

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/home" className="rounded-md">
          <Logo size={28} />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/home"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {t("nav.home")}
          </Link>
          <Link
            href="/settings"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {t("nav.settings")}
          </Link>
          <form action={signOut}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("logout")}
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
