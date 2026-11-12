"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "system", icon: Monitor },
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
] as const;

/**
 * Light, dark or like the device (owner, 2026-11-12), in Settings. Saved on this device by next-themes
 * (localStorage) and applied at once, so there's no Save button.
 */
export function ThemeSwitch() {
  const t = useTranslations("Settings.theme");
  const { theme, setTheme } = useTheme();
  // The saved theme is only known in the browser; until then nothing is shown as selected.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{t("label")}</legend>
      <div className="flex w-fit rounded-full border p-0.5 text-sm font-medium">
        {OPTIONS.map(({ value, icon: Icon }) => {
          const selected = mounted && theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              aria-pressed={selected}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {t(value)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Makes the browser tab icon follow the chosen theme, also when it differs from the device's
 * (`icon.svg` alone can only follow the device). The home screen icons stay light.
 */
export function ThemeTabIcon() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;
    const href = `/brand/stramin-icon-${resolvedTheme}.svg`;
    for (const link of document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"][type="image/svg+xml"]',
    )) {
      link.href = href;
    }
  }, [resolvedTheme]);
  return null;
}
