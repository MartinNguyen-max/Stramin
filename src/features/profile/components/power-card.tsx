import { ExternalLink } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { SPORT_BG } from "@/features/activities/sport-style";
import { stravaActivityUrl } from "@/features/activities/strava-url";
import { DEMO_ID_PREFIX } from "@/features/demo/demo-activities";
import { FTP_SHARE, type PowerBest } from "@/lib/analytics/power";
import { toDisplayDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Best bike power per duration and the FTP estimate (BE-3, owner feedback P3). */
export function PowerCard({ power }: { power: PowerBest[] }) {
  const t = useTranslations("Profile.power");
  const format = useFormatter();
  const twenty = power.find((entry) => entry.duration === 1200);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold">
          <span className={cn("size-2.5 rounded-full", SPORT_BG.bike)} />
          {t("title")}
        </h3>
        {twenty && (
          <span className="text-right">
            <span className="block text-2xl font-bold tabular-nums">
              {t("ftp", { watts: Math.round(twenty.watts * FTP_SHARE) })}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("ftpNote")}
            </span>
          </span>
        )}
      </div>
      {power.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {power.map((entry) => (
            <li
              key={entry.duration}
              className="flex flex-col gap-0.5 rounded-xl bg-muted/50 p-3"
            >
              <span className="text-xs text-muted-foreground">
                {t(`durations.${entry.duration}` as "durations.60")}
              </span>
              <span className="text-lg font-semibold tabular-nums">
                {entry.watts} W
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {format.dateTime(toDisplayDate(entry.date), {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {!entry.activityId.startsWith(DEMO_ID_PREFIX) && (
                  <a
                    href={stravaActivityUrl(entry.activityId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("viewRide")}
                    className="text-[#FC4C02]"
                  >
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("none")}</p>
      )}
    </section>
  );
}
