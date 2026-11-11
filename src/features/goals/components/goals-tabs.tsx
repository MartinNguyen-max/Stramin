"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type GoalsBase = "/goals" | "/demo/goals";

/** "My goals | Pace calculator" at the top of the Goals pages (owner feedback 2026-11-12). */
export function GoalsTabs({ base }: { base: GoalsBase }) {
  const t = useTranslations("Goals.tabs");
  const pathname = usePathname();
  const tabs = [
    { href: base, label: t("goals") },
    { href: `${base}/calculator` as const, label: t("calculator") },
  ];
  return (
    <nav className="flex w-fit gap-1 rounded-full border bg-card p-1 text-sm">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 font-medium transition-colors",
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
