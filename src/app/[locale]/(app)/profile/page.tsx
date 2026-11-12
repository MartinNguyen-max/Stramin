import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { getCurrentUser } from "@/features/auth/current-user";
import { loadBestEfforts } from "@/features/profile/best-efforts-data";
import { BestEffortsCard } from "@/features/profile/components/best-efforts-card";
import { LevelCard } from "@/features/profile/components/level-card";
import { PowerCard } from "@/features/profile/components/power-card";
import { ProgressCard } from "@/features/profile/components/progress-card";
import { getPreferences } from "@/features/profile/data";
import { PROGRESS_MONTHS, progressOver } from "@/features/profile/progress";
import { ConnectStravaButton } from "@/features/strava/components/connect-strava-button";
import { EFFORT_SPORTS } from "@/lib/analytics/best-efforts";
import { today } from "@/lib/dates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Profile");
  return { title: `${t("title")} · Stramin` };
}

/** Profile (UI_SPEC §6): name, best efforts and running level. */
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}

async function ProfileContent() {
  const t = await getTranslations("Profile");
  const user = await getCurrentUser();
  const locale = (await getLocale()) as "en" | "da";

  const [{ units }, { efforts, activities, manualAvailable, power }] =
    await Promise.all([getPreferences(user, locale), loadBestEfforts(user)]);
  const name = user.name ?? user.email ?? "";

  return (
    <>
      <section className="flex flex-wrap items-center gap-4">
        <span
          aria-hidden
          className="grid size-14 place-items-center rounded-full bg-linear-to-br from-zone-1 via-zone-3 to-zone-5 text-xl font-bold text-black/80"
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-2xl font-bold tracking-tight">{name}</h1>
          {user.email && user.email !== name && (
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          )}
        </div>
        <div className="ml-auto text-sm">
          {activities ? (
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1">
              <span className="size-2 rounded-full bg-zone-2" />
              {t("stravaConnected")}
            </span>
          ) : (
            <ConnectStravaButton next="/profile" />
          )}
        </div>
      </section>

      {!activities && (
        <p className="text-sm text-muted-foreground">
          {t("stravaNotConnected")}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("bestEfforts.title")}</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t("bestEfforts.note")}
        </p>
        {!manualAvailable && (
          <p className="rounded-2xl border border-dashed p-3 text-sm text-muted-foreground">
            {t("bestEfforts.unavailable")}
          </p>
        )}
        <div className="grid gap-4 lg:grid-cols-3">
          {EFFORT_SPORTS.map((sport) => (
            <BestEffortsCard
              key={sport}
              sport={sport}
              efforts={efforts}
              units={units}
              editable={manualAvailable}
            />
          ))}
        </div>
      </section>

      <PowerCard power={power} />
      <LevelCard efforts={efforts} units={units} />
      {activities && (
        <ProgressCard
          periods={PROGRESS_MONTHS.map((months) =>
            progressOver(activities, today(), months),
          )}
          units={units}
        />
      )}
    </>
  );
}

function ProfileSkeleton() {
  const t = useTranslations("Profile");
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <ZoneSpinner size={72} label={t("loading")} />
    </div>
  );
}
