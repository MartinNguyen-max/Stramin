"use client";

import {
  House,
  type LucideIcon,
  Settings,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** The four main sections (UI_SPEC: Navigation). */
const SECTIONS: {
  href: string;
  key: "home" | "goals" | "training" | "profile";
  icon: LucideIcon;
}[] = [
  { href: "/home", key: "home", icon: House },
  { href: "/goals", key: "goals", icon: Target },
  { href: "/training", key: "training", icon: Sparkles },
  { href: "/profile", key: "profile", icon: User },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop: the sections as links in the header, plus the settings gear. */
export function HeaderNav() {
  const t = useTranslations("App.nav");
  const isActive = useIsActive();
  return (
    <nav className="flex items-center gap-1 text-sm">
      <ul className="hidden items-center gap-1 md:flex">
        {SECTIONS.map(({ href, key }) => (
          <li key={key}>
            <Link
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 font-medium transition-colors",
                isActive(href)
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(key)}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/settings"
        aria-label={t("settings")}
        title={t("settings")}
        aria-current={isActive("/settings") ? "page" : undefined}
        className={cn(
          "ml-1 rounded-lg p-2 transition-colors",
          isActive("/settings")
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Settings className="size-5" />
      </Link>
    </nav>
  );
}

/** Phones: a fixed tab bar at the bottom, like an installed app. */
export function BottomNav() {
  const t = useTranslations("App.nav");
  const isActive = useIsActive();
  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {SECTIONS.map(({ href, key, icon: Icon }) => (
          <li key={key}>
            <Link
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                isActive(href) ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon
                className={cn("size-5", isActive(href) && "stroke-[2.5]")}
              />
              {t(key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
