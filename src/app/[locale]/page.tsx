import {
  Activity,
  CalendarRange,
  ChartColumn,
  ShieldCheck,
  Target,
  Timer,
  Trophy,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const FEATURES = [
  { key: "weekly", icon: ChartColumn, color: "text-zone-1" },
  { key: "averages", icon: CalendarRange, color: "text-zone-2" },
  { key: "bestEfforts", icon: Trophy, color: "text-zone-3" },
  { key: "goals", icon: Target, color: "text-zone-4" },
  { key: "countdowns", icon: Timer, color: "text-zone-5" },
  { key: "activities", icon: Activity, color: "text-zone-1" },
] as const;

const PRIVACY_POINTS = ["onlyYou", "noAds", "control"] as const;

/** Public landing page (UI_SPEC §1). */
export default function LandingPage() {
  const t = useTranslations("Landing");

  return (
    <>
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-4 pt-12 pb-20 sm:px-6 sm:pt-20">
        {/* Hero */}
        <section className="flex flex-col items-start gap-6">
          <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            {t("hero.badge")}
          </span>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "px-5")}
            >
              {t("hero.signup")}
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "px-5",
              )}
            >
              {t("hero.login")}
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="flex flex-col gap-8">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("features.title")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ key, icon: Icon, color }) => (
              <li
                key={key}
                className="flex flex-col gap-3 rounded-2xl border bg-card p-5"
              >
                <Icon className={cn("size-6", color)} aria-hidden />
                <h3 className="font-semibold">{t(`features.${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(`features.${key}.text`)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Privacy */}
        <section className="flex flex-col gap-6 rounded-2xl border bg-card p-6 sm:p-10">
          <ShieldCheck className="size-8 text-zone-2" aria-hidden />
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("privacy.title")}
          </h2>
          <ul className="flex flex-col gap-2 text-muted-foreground">
            {PRIVACY_POINTS.map((point) => (
              <li key={point}>{t(`privacy.${point}`)}</li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
