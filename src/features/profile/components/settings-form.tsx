"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useState, useTransition } from "react";
import { Segmented } from "@/components/ui/segmented";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  LOCALES,
  UNITS,
  type Units,
  WEEK_STARTS,
  type WeekStart,
} from "@/lib/preferences";
import { savePreference } from "../actions";
import type { Settings } from "../schemas";

const THEMES = ["system", "light", "dark"] as const;
type Theme = (typeof THEMES)[number];
const THEME_ICONS = { system: Monitor, light: Sun, dark: Moon };

/**
 * Settings (SET-1..3, owner feedback 2026-11-12): every choice applies the moment it's tapped, no Save
 * button. Units and week start are saved on the profile; the language switches the page (and the
 * language cookie) and is saved too; the theme is kept on this device.
 */
export function SettingsForm({ initial }: { initial: Settings }) {
  const t = useTranslations("Settings");
  const router = useRouter();
  const pathname = usePathname();
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [pending, startTransition] = useTransition();

  const { theme, setTheme } = useTheme();
  // The saved theme is only known in the browser.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const change = (patch: Partial<Settings>) => {
    const before = values;
    setValues({ ...values, ...patch });
    setStatus("idle");
    startTransition(async () => {
      const { ok } = await savePreference(patch);
      if (!ok) {
        setValues(before);
        setStatus("error");
        return;
      }
      setStatus("saved");
      if (patch.locale) router.replace(pathname, { locale: patch.locale });
    });
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col divide-y">
        <Row label={t("units.label")}>
          <Segmented<Units>
            label={t("units.label")}
            value={values.units}
            disabled={pending}
            onChange={(units) => change({ units })}
            options={UNITS.map((value) => ({
              value,
              label: t(`units.${value}`),
            }))}
          />
        </Row>
        <Row label={t("weekStart.label")}>
          <Segmented<WeekStart>
            label={t("weekStart.label")}
            value={values.weekStart}
            disabled={pending}
            onChange={(weekStart) => change({ weekStart })}
            options={WEEK_STARTS.map((value) => ({
              value,
              label: t(`weekStart.${value}`),
            }))}
          />
        </Row>
        <Row label={t("language.label")}>
          <Segmented<Settings["locale"]>
            label={t("language.label")}
            value={values.locale}
            disabled={pending}
            onChange={(locale) => change({ locale })}
            options={LOCALES.map((value) => ({
              value,
              label: t(`language.${value}`),
            }))}
          />
        </Row>
        <Row label={t("theme.label")}>
          <Segmented<Theme>
            label={t("theme.label")}
            value={mounted ? ((theme as Theme | undefined) ?? "system") : null}
            onChange={setTheme}
            options={THEMES.map((value) => ({
              value,
              label: t(`theme.${value}`),
              icon: THEME_ICONS[value],
            }))}
          />
        </Row>
      </div>

      <p className="min-h-5 pt-3 text-sm" aria-live="polite">
        {status === "saved" && (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Check className="size-4 text-zone-2" />
            {t("saved")}
          </span>
        )}
        {status === "error" && (
          <span role="alert" className="text-destructive">
            {t("error")}
          </span>
        )}
      </p>
    </div>
  );
}

/** A setting: its name on the left (on top on phones), the choices on the right. */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}
