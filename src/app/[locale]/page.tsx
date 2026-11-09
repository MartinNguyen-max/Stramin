import { useTranslations } from "next-intl";

// Placeholder. Replaced by the real landing page in M1 step 8.
export default function Home() {
  const t = useTranslations("Home");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Stramin</h1>
      <p className="text-lg text-muted-foreground">{t("tagline")}</p>
    </main>
  );
}
