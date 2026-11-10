import { useTranslations } from "next-intl";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { DemoNav } from "@/features/demo/demo-nav";
import { Link } from "@/i18n/navigation";

/** The public demo (UI_SPEC screen map): the app's pages with made-up training, read-only. */
export default function DemoLayout({
  children,
}: LayoutProps<"/[locale]/demo">) {
  const t = useTranslations("Demo");
  return (
    <>
      <SiteHeader wide />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pt-4 pb-20 sm:px-6">
        <div className="flex flex-col gap-3 rounded-2xl border bg-card px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              <span className="font-semibold">{t("title")}.</span>{" "}
              <span className="text-muted-foreground">{t("text")}</span>
            </p>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>
              {t("signup")}
            </Link>
          </div>
          <DemoNav />
        </div>
        {children}
      </main>
      <SiteFooter wide />
    </>
  );
}
