"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { switchAccount } from "../actions";

/** Shown on Log in when this device has a saved login (ACC-3). */
export function ContinueAs({
  name,
  email,
}: {
  name: string;
  email: string | undefined;
}) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (pending) {
    return <ZoneSpinner label={t("pleaseWait")} className="self-center py-6" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        size="lg"
        onClick={() => startTransition(() => router.push("/home"))}
      >
        {t("continueAs", { name })}
      </Button>
      {email && email !== name && (
        <p className="-mt-1 text-center text-xs text-muted-foreground">
          {email}
        </p>
      )}
      <form action={switchAccount}>
        <input type="hidden" name="locale" value={locale} />
        <Button type="submit" variant="outline" size="lg" className="w-full">
          {t("useAnotherAccount")}
        </Button>
      </form>
    </div>
  );
}
