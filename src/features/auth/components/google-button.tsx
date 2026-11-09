"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "../actions";
import { initialAuthState } from "../schemas";

/** "Continue with Google". Only rendered when Google login is enabled (ADR 0004). */
export function GoogleButton() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(
    signInWithGoogle,
    initialAuthState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="locale" value={locale} />
      <Button type="submit" variant="outline" size="lg" disabled={pending}>
        {t("continueWithGoogle")}
      </Button>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${state.error}`)}
        </p>
      )}
    </form>
  );
}
