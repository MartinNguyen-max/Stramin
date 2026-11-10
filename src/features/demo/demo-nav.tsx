"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PAGES = [
  { href: "/demo", key: "home" },
  { href: "/demo/goals", key: "goals" },
  { href: "/demo/training", key: "training" },
  { href: "/demo/profile", key: "profile" },
] as const;

/** Moves between the demo versions of the app's sections. */
export function DemoNav() {
  const t = useTranslations("App.nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")} className="flex flex-wrap gap-1 text-sm">
      {PAGES.map(({ href, key }) => {
        const active = pathname === href;
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 font-medium transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
