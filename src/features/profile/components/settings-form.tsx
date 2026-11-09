"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { LOCALES, UNITS, WEEK_STARTS } from "@/lib/preferences";
import { updateSettings } from "../actions";
import type { Settings, SettingsFormState } from "../schemas";

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/** Settings form (SET-1..3). */
export function SettingsForm({ initial }: { initial: Settings }) {
  const t = useTranslations("Settings");
  const [state, formAction, pending] = useActionState<
    SettingsFormState,
    FormData
  >(updateSettings, { status: "idle" });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="currentLocale" value={initial.locale} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="units">{t("units.label")}</Label>
        <select
          id="units"
          name="units"
          defaultValue={initial.units}
          className={selectClass}
        >
          {UNITS.map((value) => (
            <option key={value} value={value}>
              {t(`units.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="weekStart">{t("weekStart.label")}</Label>
        <select
          id="weekStart"
          name="weekStart"
          defaultValue={initial.weekStart}
          className={selectClass}
        >
          {WEEK_STARTS.map((value) => (
            <option key={value} value={value}>
              {t(`weekStart.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="locale">{t("language.label")}</Label>
        <select
          id="locale"
          name="locale"
          defaultValue={initial.locale}
          className={selectClass}
        >
          {LOCALES.map((value) => (
            <option key={value} value={value}>
              {t(`language.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {t("save")}
        </Button>
        {state.status === "saved" && (
          <output className="text-sm text-muted-foreground">
            {t("saved")}
          </output>
        )}
        {state.status === "error" && (
          <p role="alert" className="text-sm text-destructive">
            {t("error")}
          </p>
        )}
      </div>
    </form>
  );
}
