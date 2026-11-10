"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  distanceKey,
  EFFORT_DISTANCES,
  EFFORT_SPORTS,
  type EffortSport,
} from "@/lib/analytics/best-efforts";
import { formatClock, parseClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createGoal, type GoalFormState } from "../actions";
import { isTargetAllowed, suggestTargets } from "../feedback";

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const idle: GoalFormState = { status: "idle" };

/** New goal (GOAL-1, GOAL-5): sport → distance → current best and suggestions → target time. */
export function GoalForm({
  bests,
  distanceLabels,
  startOpen,
}: {
  /** Current bests by sport and integer distance. */
  bests: { sport: EffortSport; distance: number; seconds: number }[];
  /** Labels by sport and integer distance, e.g. "run-21098" → "Half marathon". */
  distanceLabels: Record<string, string>;
  startOpen: boolean;
}) {
  const t = useTranslations("Goals");
  const tSports = useTranslations("Activities.sports");
  const [open, setOpen] = useState(startOpen);
  const [sport, setSport] = useState<EffortSport>("run");
  const [distance, setDistance] = useState(5000);
  const [time, setTime] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  const [state, action, pending] = useActionState(
    async (prev: GoalFormState, formData: FormData) => {
      const result = await createGoal(prev, formData);
      if (result.status === "saved") {
        setTime("");
        setOpen(false);
      }
      return result;
    },
    idle,
  );

  const best = bests.find(
    (b) => b.sport === sport && b.distance === distance,
  )?.seconds;
  const suggestions = best ? suggestTargets(best) : [];

  if (!open) {
    return (
      <Button size="lg" className="self-start" onClick={() => setOpen(true)}>
        <Plus />
        {t("add")}
      </Button>
    );
  }

  const serverError =
    state.status === "error"
      ? state.error === "notFaster"
        ? t("errors.notFaster", { time: formatClock(state.best ?? 0) })
        : t(`errors.${state.error}`)
      : null;

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const target = parseClock(time);
        if (!target) {
          event.preventDefault();
          setClientError(t("errors.timeInvalid"));
        } else if (!isTargetAllowed(target, best)) {
          event.preventDefault();
          setClientError(
            t("errors.notFaster", { time: formatClock(best ?? 0) }),
          );
        } else {
          setClientError(null);
        }
      }}
      className="flex flex-col gap-4 rounded-2xl border bg-card p-4"
    >
      <h2 className="font-semibold">{t("add")}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-sport">{t("form.sport")}</Label>
          <select
            id="goal-sport"
            name="sport"
            value={sport}
            onChange={(event) => {
              const next = event.target.value as EffortSport;
              setSport(next);
              setDistance(
                distanceKey(
                  EFFORT_DISTANCES[next][1] ?? EFFORT_DISTANCES[next][0],
                ),
              );
              setTime("");
            }}
            className={selectClass}
          >
            {EFFORT_SPORTS.map((option) => (
              <option key={option} value={option}>
                {tSports(option)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-distance">{t("form.distance")}</Label>
          <select
            id="goal-distance"
            name="distance"
            value={distance}
            onChange={(event) => {
              setDistance(Number(event.target.value));
              setTime("");
            }}
            className={selectClass}
          >
            {EFFORT_DISTANCES[sport].map((meters) => (
              <option key={meters} value={distanceKey(meters)}>
                {distanceLabels[`${sport}-${distanceKey(meters)}`]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        {best ? (
          <>
            <p>{t("form.currentBest", { time: formatClock(best) })}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">
                {t("form.suggestions")}:
              </span>
              {suggestions.map((suggestion) => {
                const label = formatClock(suggestion);
                return (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setTime(label)}
                    className={cn(
                      "rounded-full border px-3 py-1 font-medium tabular-nums transition-colors",
                      time === label
                        ? "border-foreground bg-foreground text-background"
                        : "hover:bg-muted",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">{t("form.noBest")}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal-time">{t("form.target")}</Label>
        <Input
          id="goal-time"
          name="time"
          required
          inputMode="numeric"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          placeholder={t("form.targetPlaceholder")}
          className="w-40"
        />
      </div>

      {(clientError ?? serverError) && (
        <p role="alert" className="text-sm text-destructive">
          {clientError ?? serverError}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {t("form.save")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => setOpen(false)}
        >
          {t("form.cancel")}
        </Button>
      </div>
    </form>
  );
}
