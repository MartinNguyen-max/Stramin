"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { SportIcon } from "@/features/calendar/components/sport-lines";
import type { Units } from "@/lib/preferences";
import {
  distanceInput,
  hoursInput,
  WEEKLY_SPORTS,
  type WeeklyGoal,
  type WeeklySport,
} from "../weekly";
import { saveWeeklyGoal, type WeeklyGoalState } from "../weekly-actions";

type Kind = "none" | "distance" | "time";
type SportInput = { kind: Kind; value: string };

const idle: WeeklyGoalState = { status: "idle" };

function initialSport(
  goal: WeeklyGoal | null,
  sport: WeeklySport,
  units: Units,
): SportInput {
  const target = goal?.sports[sport];
  if (!target) return { kind: "none", value: "" };
  return "meters" in target
    ? { kind: "distance", value: distanceInput(target.meters, units) }
    : { kind: "time", value: hoursInput(target.seconds) };
}

/**
 * The weekly goal (owner feedback 2026-11-17): hours per week, and per sport optionally a distance or
 * a time. Everything is optional; what's left empty is compared with the average week on Home.
 */
export function WeeklyGoalForm({
  goal,
  units,
  readOnly = false,
}: {
  goal: WeeklyGoal | null;
  units: Units;
  /** The demo: shows an example goal, can't be saved. */
  readOnly?: boolean;
}) {
  const t = useTranslations("Goals.weekly");
  const tSports = useTranslations("Activities.sports");
  const tUnits = useTranslations("Units");
  const [state, action, pending] = useActionState(saveWeeklyGoal, idle);
  const [total, setTotal] = useState(
    goal?.totalSeconds ? hoursInput(goal.totalSeconds) : "",
  );
  const [sports, setSports] = useState<Record<WeeklySport, SportInput>>(() => ({
    swim: initialSport(goal, "swim", units),
    bike: initialSport(goal, "bike", units),
    run: initialSport(goal, "run", units),
  }));
  const distanceUnit = units === "imperial" ? "mi" : "km";
  const errorFor = (field: "total" | WeeklySport) =>
    state.status === "error" && state.field === field
      ? t(`errors.${state.error}`)
      : null;

  return (
    <form
      action={action}
      className="flex flex-col gap-5 rounded-2xl border bg-card p-4 sm:p-5"
    >
      <fieldset disabled={readOnly || pending} className="contents">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="weekly-total">{t("hours")}</Label>
          <div className="flex items-center gap-2">
            <Input
              id="weekly-total"
              name="total"
              inputMode="decimal"
              placeholder="8:00"
              value={total}
              onChange={(event) => setTotal(event.target.value)}
              aria-invalid={errorFor("total") ? true : undefined}
              className="w-28"
            />
            <span className="text-sm text-muted-foreground">
              {t("perWeek", { unit: tUnits("hour") })}
            </span>
          </div>
          <FieldNote error={errorFor("total")} hint={t("hoursHint")} />
        </div>

        <div className="flex flex-col gap-3 border-t pt-4">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-medium">{t("sportsTitle")}</h3>
            <p className="text-xs text-muted-foreground">{t("sportsHint")}</p>
          </div>
          {WEEKLY_SPORTS.map((sport) => {
            const input = sports[sport];
            const set = (next: Partial<SportInput>) =>
              setSports((current) => ({
                ...current,
                [sport]: { ...current[sport], ...next },
              }));
            return (
              <div key={sport} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="flex w-20 items-center gap-1.5 text-sm font-medium">
                    <SportIcon sport={sport} className="size-4" />
                    {tSports(sport)}
                  </span>
                  <input
                    type="hidden"
                    name={`${sport}Kind`}
                    value={input.kind}
                  />
                  <Segmented<Kind>
                    label={t("kindLabel", { sport: tSports(sport) })}
                    value={input.kind}
                    disabled={readOnly || pending}
                    onChange={(kind) => set({ kind, value: "" })}
                    options={[
                      { value: "none", label: t("none") },
                      { value: "distance", label: distanceUnit },
                      { value: "time", label: t("time") },
                    ]}
                  />
                  {input.kind !== "none" && (
                    <span className="flex items-center gap-2">
                      <Input
                        name={`${sport}Value`}
                        aria-label={t("valueLabel", { sport: tSports(sport) })}
                        inputMode="decimal"
                        placeholder={input.kind === "distance" ? "30" : "3:00"}
                        value={input.value}
                        onChange={(event) => set({ value: event.target.value })}
                        aria-invalid={errorFor(sport) ? true : undefined}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        {input.kind === "distance"
                          ? distanceUnit
                          : tUnits("hour")}
                      </span>
                    </span>
                  )}
                </div>
                <FieldNote error={errorFor(sport)} />
              </div>
            );
          })}
        </div>
      </fieldset>

      {readOnly ? (
        <p className="text-sm text-muted-foreground">{t("demo")}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={pending}>
            {t("save")}
          </Button>
          {state.status === "saved" && !pending && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Check className="size-4 text-zone-2" />
              {t("saved")}
            </span>
          )}
          {state.status === "error" && !state.field && (
            <span className="text-sm text-destructive">
              {t(`errors.${state.error}`)}
            </span>
          )}
        </div>
      )}
    </form>
  );
}

function FieldNote({ error, hint }: { error: string | null; hint?: string }) {
  if (error) return <p className="text-xs text-destructive">{error}</p>;
  if (hint) return <p className="text-xs text-muted-foreground">{hint}</p>;
  return null;
}
