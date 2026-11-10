import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { ConnectStravaButton } from "@/features/strava/components/connect-strava-button";
import { Link } from "@/i18n/navigation";

/** Shown instead of the calendar when Strava isn't connected. */
export function ConnectCard({ next = "/home" }: { next?: string }) {
  const t = useTranslations("Home");
  return (
    <section className="flex flex-col items-start gap-4 rounded-2xl border bg-card p-6">
      <h2 className="text-lg font-semibold">{t("connect.title")}</h2>
      <p className="text-sm text-muted-foreground">{t("connect.text")}</p>
      <div className="flex flex-wrap gap-3">
        <ConnectStravaButton next={next} />
        <Link
          href="/demo"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          {t("connect.demo")}
        </Link>
        <Link
          href="/guide"
          className={buttonVariants({ variant: "ghost", size: "lg" })}
        >
          {t("connect.garminGuide")}
        </Link>
      </div>
    </section>
  );
}
