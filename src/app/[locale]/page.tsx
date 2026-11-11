import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { HeroDevices, LandingVideo } from "@/features/landing/showcase";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PRIVACY_POINTS = ["onlyYou", "noAds", "control"] as const;

/**
 * Public landing page (UI_SPEC §1): what Stramin is, shown with the real app and example data
 * (owner feedback L1). The text is static; the example screens stream in.
 */
export default function LandingPage() {
  const t = useTranslations("Landing");

  return (
    <>
      <SiteHeader wide />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-20 px-4 pt-10 pb-24 sm:px-6 sm:pt-16">
        {/* Hero */}
        <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="flex flex-col items-start gap-6">
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
                href="/demo"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "px-5",
                )}
              >
                {t("hero.demo")}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("hero.haveAccount")}{" "}
              <Link
                href="/login"
                className="font-medium text-foreground underline underline-offset-4"
              >
                {t("hero.login")}
              </Link>
            </p>
          </div>
          {/* Home on PC and phone (on phones only the phone). */}
          <Suspense fallback={<ShowcaseSpinner />}>
            <HeroDevices />
          </Suspense>
        </section>

        <LandingVideo />

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

        {/* Call to action */}
        <section className="flex flex-col items-center gap-5 text-center">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            {t("cta.title")}
          </h2>
          <p className="max-w-xl text-muted-foreground">{t("cta.text")}</p>
          <Link
            href="/signup"
            className={cn(buttonVariants({ size: "lg" }), "px-6")}
          >
            {t("hero.signup")}
          </Link>
        </section>
      </main>

      <SiteFooter wide />
    </>
  );
}

function ShowcaseSpinner() {
  const t = useTranslations("Demo");
  return (
    <div className="flex justify-center py-16">
      <ZoneSpinner size={64} label={t("loading")} />
    </div>
  );
}
