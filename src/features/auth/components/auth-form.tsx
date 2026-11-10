"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  type AuthFormState,
  initialAuthState,
  MAX_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  NAME_HTML_PATTERN,
} from "../schemas";

type Field = "name" | "email" | "password" | "newPassword";

type AuthFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  fields: Field[];
  submitLabel: string;
};

/**
 * Shared form for login, sign-up and password reset.
 * Uses a Server Action, so it also works before JavaScript has loaded.
 */
export function AuthForm({ action, fields, submitLabel }: AuthFormProps) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(action, initialAuthState);

  if (state.status === "success") {
    return (
      <output className="block rounded-lg border bg-card p-4 text-sm">
        {t(`success.${state.message}`)}
      </output>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      {fields.includes("name") && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="given-name"
            maxLength={MAX_NAME_LENGTH}
            pattern={NAME_HTML_PATTERN}
            title={t("errors.nameInvalid")}
            defaultValue={state.status === "error" ? state.name : undefined}
            required
          />
        </div>
      )}
      {fields.includes("email") && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.status === "error" ? state.email : undefined}
            required
          />
        </div>
      )}
      {fields.includes("password") && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
      )}
      {fields.includes("newPassword") && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("newPassword")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
          <p className="text-xs text-muted-foreground">
            {t("passwordHint", { min: MIN_PASSWORD_LENGTH })}
          </p>
        </div>
      )}

      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("pleaseWait") : submitLabel}
      </Button>
    </form>
  );
}
