"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Switches between English and Danish, staying on the same page.
 * Uses plain links, so it works even before JavaScript has loaded.
 */
export function LanguageSwitcher() {
  const t = useTranslations("Common");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav
      className="flex rounded-full border p-0.5 text-xs font-medium"
      aria-label={t("language")}
    >
      {routing.locales.map((option) => (
        <Link
          key={option}
          href={pathname}
          locale={option}
          aria-current={option === locale ? "true" : undefined}
          className={cn(
            "rounded-full px-2.5 py-1 uppercase transition-colors",
            option === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option}
        </Link>
      ))}
    </nav>
  );
}
