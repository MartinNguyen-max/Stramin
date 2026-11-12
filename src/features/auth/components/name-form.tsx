"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateName } from "../actions";
import {
  MAX_NAME_LENGTH,
  NAME_HTML_PATTERN,
  type NameFormState,
} from "../form-state";

/** Change the name in Settings (ACC-5). */
export function NameForm({ initial }: { initial: string | undefined }) {
  const t = useTranslations("Auth");
  const tSettings = useTranslations("Settings");
  const [state, formAction, pending] = useActionState<NameFormState, FormData>(
    updateName,
    { status: "idle" },
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
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
          defaultValue={initial}
          required
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {tSettings("save")}
        </Button>
        {state.status === "saved" && (
          <output className="text-sm text-muted-foreground">
            {tSettings("saved")}
          </output>
        )}
        {state.status === "error" && (
          <p role="alert" className="text-sm text-destructive">
            {t(`errors.${state.error}`)}
          </p>
        )}
      </div>
    </form>
  );
}
