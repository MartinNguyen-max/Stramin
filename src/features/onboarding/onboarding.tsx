"use client";

import { CalendarDays, Gauge, Sparkles, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "./actions";

const STEPS = [
  { key: "welcome", Icon: Sparkles },
  { key: "calendar", Icon: CalendarDays },
  { key: "goals", Icon: Target },
  { key: "profile", Icon: Gauge },
] as const;

/**
 * A short introduction the first time someone opens Home (owner feedback 2026-11-12): four small
 * steps, skippable. Closing it in any way marks it as seen, so it never comes back.
 */
export function Onboarding({ name }: { name: string }) {
  const t = useTranslations("Onboarding");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [, startTransition] = useTransition();
  const { key, Icon } = STEPS[step];
  const last = step === STEPS.length - 1;

  const close = () => {
    setOpen(false);
    startTransition(() => completeOnboarding());
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent closeLabel={tCommon("close")} className="gap-5">
        <span className="grid size-12 place-items-center rounded-2xl bg-muted">
          <Icon className="size-6" />
        </span>
        <div className="flex flex-col gap-2">
          <DialogTitle>{t(`${key}.title`, { name })}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t(`${key}.text`)}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="flex gap-1.5" aria-hidden>
            {STEPS.map((item, index) => (
              <span
                key={item.key}
                className={cn(
                  "size-2 rounded-full",
                  index === step ? "bg-foreground" : "bg-muted",
                )}
              />
            ))}
          </span>
          <span className="flex gap-2">
            {!last && (
              <Button variant="ghost" onClick={close}>
                {t("skip")}
              </Button>
            )}
            <Button onClick={() => (last ? close() : setStep(step + 1))}>
              {last ? t("done") : t("next")}
            </Button>
          </span>
        </div>
        <p className="sr-only" aria-live="polite">
          {t("progress", { step: step + 1, total: STEPS.length })}
        </p>
      </DialogContent>
    </Dialog>
  );
}
