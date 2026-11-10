import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * "Connect with Strava" in Strava's orange (NFR-5). A plain link: the route starts the OAuth flow.
 * TODO (release): swap in Strava's official button artwork from their brand guidelines.
 */
export function ConnectStravaButton({
  next = "/home",
  className,
}: {
  next?: string;
  className?: string;
}) {
  const t = useTranslations("Strava");
  return (
    <a
      href={`/api/strava/connect?next=${encodeURIComponent(next)}`}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-[#FC4C02] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#e04402]",
        className,
      )}
    >
      {t("connect")}
    </a>
  );
}
