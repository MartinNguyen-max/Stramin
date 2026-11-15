"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useState,
  useTransition,
} from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { Segmented } from "@/components/ui/segmented";
import { getPathname, usePathname } from "@/i18n/navigation";
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
 * button. Units and week start are saved on the profile; the theme is kept on this device. The
 * language is saved, then the whole app reloads in it (with the spinner), so every part of it changes;
 * the language shown is always the page's own (`useLocale`), never a remembered state.
 */
export function SettingsForm({ initial }: { initial: Settings }) {
  const t = useTranslations("Settings");
  const locale = useLocale() as Settings["locale"];
  const pathname = usePathname();
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [switchingTo, setSwitchingTo] = useState<Settings["locale"] | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  // Next.js keeps a page you leave alive and shows it again later (Cache Components). Start clean then,
  // from what the server sent, so an old choice never shows (owner feedback 2026-11-12).
  useLayoutEffect(
    () => () => {
      setValues(initial);
      setStatus("idle");
      setSwitchingTo(null);
    },
    [initial],
  );

  const { theme, setTheme } = useTheme();
  // The saved theme is only known in the browser.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const switchLanguage = (next: Settings["locale"]) => {
    setSwitchingTo(next);
    setStatus("idle");
    startTransition(async () => {
      const { ok } = await savePreference({ locale: next });
      if (!ok) {
        setSwitchingTo(null);
        setStatus("error");
        return;
      }
      // A full load in the new language (the action already set the language cookie).
      window.location.assign(getPathname({ href: pathname, locale: next }));
    });
  };

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
    });
  };

  return (
    <div className="flex flex-col">
      {switchingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <ZoneSpinner size={72} label={t("language.switching")} />
        </div>
      )}
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
            value={switchingTo ?? locale}
            disabled={pending}
            onChange={switchLanguage}
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

      <div className="min-h-7 pt-3 text-sm" aria-live="polite">
        {/* Our own spinner while a change is saved (owner, 2026-11-12). */}
        {pending && !switchingTo && (
          <ZoneSpinner
            size={20}
            label={t("saving")}
            className="flex-row gap-2 text-muted-foreground"
          />
        )}
        {!pending && status === "saved" && (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Check className="size-4 text-zone-2" />
            {t("saved")}
          </span>
        )}
        {!pending && status === "error" && (
          <span role="alert" className="text-destructive">
            {t("error")}
          </span>
        )}
      </div>
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
