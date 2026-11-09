import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/current-user";
import { SettingsForm } from "@/features/profile/components/settings-form";
import { getOrCreateProfile } from "@/features/profile/data";
import type { Settings } from "@/features/profile/schemas";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Settings");
  return { title: `${t("title")} · Stramin` };
}

/** Settings (UI_SPEC §7): preferences, connections and account. */
export default function SettingsPage() {
  return (
    <Suspense
      fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}
    >
      <SettingsContent />
    </Suspense>
  );
}

async function SettingsContent() {
  const t = await getTranslations("Settings");
  const user = await getCurrentUser();
  const locale = (await getLocale()) as Settings["locale"];

  let initial: Settings = { units: "metric", weekStart: "monday", locale };
  let databaseAvailable = true;
  try {
    const profile = await getOrCreateProfile(user, locale);
    initial = {
      units: profile.units,
      weekStart: profile.weekStart,
      locale: profile.locale,
    };
  } catch (error) {
    console.error("[settings] profile unavailable", error);
    databaseAvailable = false;
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
        <h2 className="font-semibold">{t("preferences")}</h2>
        {databaseAvailable ? (
          <SettingsForm initial={initial} />
        ) : (
          <p className="text-sm text-destructive">{t("databaseUnavailable")}</p>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
        <h2 className="font-semibold">{t("connections.title")}</h2>
        <ul className="flex flex-col gap-3 text-sm">
          <li className="flex items-center justify-between gap-4">
            <span>Strava</span>
            <a
              href="/api/strava/connect?next=/settings"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("connections.connect")}
            </a>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span>Garmin</span>
            <span className="text-muted-foreground">
              {t("connections.comingSoon")}
            </span>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">{t("connections.note")}</p>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border bg-card p-6 text-sm">
        <h2 className="font-semibold">{t("account.title")}</h2>
        <p className="text-muted-foreground">
          {t("account.email")}: {user.email}
        </p>
      </section>
    </>
  );
}
