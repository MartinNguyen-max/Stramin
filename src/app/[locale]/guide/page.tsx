import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const STEPS = ["open", "request", "wait", "download", "upload"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Guide");
  return { title: `${t("title")} · Stramin` };
}

/** Guide: how to get your full Garmin history into Stramin (CON-10). */
export default function GuidePage() {
  const t = useTranslations("Guide");
  const locale = useLocale();
  const garminDataUrl = `https://www.garmin.com/${locale === "da" ? "da-DK" : "en-US"}/account/datamanagement/`;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-20 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-muted-foreground">{t("intro")}</p>

        <ol className="mt-8 flex flex-col gap-4">
          {STEPS.map((step, index) => (
            <li
              key={step}
              className="flex gap-4 rounded-2xl border bg-card p-5"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold">{t(`steps.${step}.title`)}</h2>
                <p className="text-sm text-muted-foreground">
                  {t(`steps.${step}.text`)}
                </p>
                {step === "open" && (
                  <a
                    href={garminDataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm font-medium underline underline-offset-4"
                  >
                    {t("openLink")}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-sm text-muted-foreground">{t("note")}</p>
      </main>
      <SiteFooter />
    </>
  );
}
