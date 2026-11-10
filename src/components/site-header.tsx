import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Header for the public pages (landing, guide, privacy, login). */
export function SiteHeader({ wide = false }: { wide?: boolean }) {
  const t = useTranslations("Common");

  return (
    <header
      className={cn(
        "mx-auto flex w-full items-center justify-between gap-3 px-4 py-4 sm:px-6",
        wide ? "max-w-7xl" : "max-w-5xl",
      )}
    >
      <Link href="/" className="rounded-md">
        <Logo size={32} />
      </Link>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <Link
          href="/login"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {t("login")}
        </Link>
      </div>
    </header>
  );
}
