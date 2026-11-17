"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type GoalsBase = "/goals" | "/demo/goals";

/**
 * "My goals | Pace calculator | Weekly goal" at the top of the Goals pages (owner feedback 2026-11-12,
 * weekly goal 2026-11-17).
 */
export function GoalsTabs({ base }: { base: GoalsBase }) {
  const t = useTranslations("Goals.tabs");
  const pathname = usePathname();
  const tabs = [
    { href: base, label: t("goals") },
    { href: `${base}/calculator` as const, label: t("calculator") },
    { href: `${base}/weekly` as const, label: t("weekly") },
  ];
  return (
    <nav className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border bg-card p-1 text-sm">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 font-medium whitespace-nowrap transition-colors sm:px-4",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
