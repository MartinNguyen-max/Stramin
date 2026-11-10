import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export const GITHUB_URL = "https://github.com/MartinNguyen-max/Stramin";

export function SiteFooter({ wide = false }: { wide?: boolean }) {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t">
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6",
          wide ? "max-w-7xl" : "max-w-5xl",
        )}
      >
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/guide" className="hover:text-foreground">
            {t("guide")}
          </Link>
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
