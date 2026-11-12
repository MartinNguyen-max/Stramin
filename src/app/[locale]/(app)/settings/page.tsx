import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { getStravaStatus } from "@/features/activities/data";
import { signOut } from "@/features/auth/actions";
import { NameForm } from "@/features/auth/components/name-form";
import { getCurrentUser } from "@/features/auth/current-user";
import { SettingsForm } from "@/features/profile/components/settings-form";
import { getOrCreateProfile } from "@/features/profile/data";
import type { Settings } from "@/features/profile/schemas";
import { ConnectStravaButton } from "@/features/strava/components/connect-strava-button";
import { StravaSettings } from "@/features/strava/components/strava-settings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Settings");
  return { title: `${t("title")} · Stramin` };
}

/** Settings (UI_SPEC §7): preferences, connections and account. */
export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 motion-safe:animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-muted" />
          <div className="h-80 rounded-2xl bg-muted" />
          <div className="h-48 rounded-2xl bg-muted" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

async function SettingsContent() {
  const t = await getTranslations("Settings");
  const tApp = await getTranslations("App");
  const user = await getCurrentUser();
  const locale = (await getLocale()) as Settings["locale"];

  const [strava, profile] = await Promise.all([
    getStravaStatus(user.id),
    getOrCreateProfile(user, locale).catch((error) => {
      console.error("[settings] profile unavailable", error);
      return null;
    }),
  ]);
  const databaseAvailable = profile !== null;
  // The language shown is the page's own (the URL), which is what the user sees.
  const initial: Settings = {
    units: profile?.units ?? "metric",
    weekStart: profile?.weekStart ?? "monday",
    locale,
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
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
          <li className="flex flex-col gap-2">
            <span className="font-medium">Strava</span>
            {strava.connected ? (
              <StravaSettings status={strava} />
            ) : (
              <ConnectStravaButton next="/settings" className="self-start" />
            )}
          </li>
          <li className="flex items-center justify-between gap-4">
            <span>Garmin</span>
            <span className="text-muted-foreground">
              {t("connections.comingSoon")}
            </span>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 text-sm">
        <h2 className="font-semibold">{t("account.title")}</h2>
        <NameForm initial={user.name} />
        <p className="text-muted-foreground">
          {t("account.email")}: {user.email}
        </p>
        <form action={signOut} className="border-t pt-4">
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {tApp("logout")}
          </button>
        </form>
      </section>
    </div>
  );
}
