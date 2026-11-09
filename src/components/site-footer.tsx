import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export const GITHUB_URL = "https://github.com/MartinNguyen-max/Stramin";

export function SiteFooter() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy" className="hover:text-foreground">
            {t("privacy")}
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
        <p className="text-xs">{t("disclaimer")}</p>
      </div>
    </footer>
  );
}
