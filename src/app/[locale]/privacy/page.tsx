import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  PRIVACY_LAST_UPDATED,
  PrivacyDa,
  PrivacyEn,
} from "@/features/legal/privacy-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Privacy");
  return { title: `${t("title")} · Stramin` };
}

/** Privacy policy page (PRIV-5). */
export default function PrivacyPage() {
  const t = useTranslations("Privacy");
  const locale = useLocale();
  const Content = locale === "da" ? PrivacyDa : PrivacyEn;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-20 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {PRIVACY_LAST_UPDATED}
        </p>
        <article className="mt-8 flex flex-col gap-4 leading-relaxed text-foreground/90 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
          <Content />
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
