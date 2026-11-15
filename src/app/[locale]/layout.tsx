import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Rubik } from "next/font/google";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ServiceWorker } from "@/components/service-worker";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeTabIcon } from "@/components/theme-tab-icon";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Brand font, used only for the "stramin" wordmark.
const rubik = Rubik({
  variable: "--font-brand",
  weight: "900",
  subsets: ["latin"],
});

/** Pre-builds every page once per language. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: "Stramin",
    description: t("description"),
    // Installed on an iPhone home screen it opens full screen, like an app (M11).
    appleWebApp: { capable: true, title: "Stramin", statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  // Lets the page use the whole screen in the installed iPhone app, so env(safe-area-inset-*) works
  // and the bottom tab bar can sit above the home bar (owner feedback 2026-11-12, batch 6).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#14141A" },
  ],
};

export default async function RootLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    // suppressHydrationWarning: next-themes sets the theme class on <html> before React loads.
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${rubik.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <ThemeTabIcon />
          </ThemeProvider>
          <ServiceWorker />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
