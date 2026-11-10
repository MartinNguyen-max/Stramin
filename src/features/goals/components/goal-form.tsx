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
import type { GoalSport } from "@/lib/db/schema/goals";
import { formatClock, formatSportPace, parseClock } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import { createGoal, type GoalFormState } from "../actions";
import { isTargetAllowed, suggestTargets } from "../feedback";
import {
  LEGS,
  type Leg,
  TRIATHLON_RACES,
  TRIATHLONS,
  type TriathlonRace,
} from "../triathlon";

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const idle: GoalFormState = { status: "idle" };

type Best = { sport: EffortSport; distance: number; seconds: number };
type SplitInputs = Record<Leg | "transitions", string>;
const EMPTY_SPLITS: SplitInputs = {
  swim: "",
  bike: "",
  run: "",
  transitions: "",
};

/**
 * New goal (GOAL-1, GOAL-5): sport → distance → current best and suggestions → target time, with the
 * pace beside every time (owner feedback 2026-11-11, G2). Triathlon: a time per discipline (G1).
 */
export function GoalForm({
  bests,
  distanceLabels,
  units,
  startOpen,
}: {
  /** Current bests by sport and integer distance. */
  bests: Best[];
  /** Labels by sport and integer distance, e.g. "run-21098" → "Half marathon". */
  distanceLabels: Record<string, string>;
  units: Units;
  startOpen: boolean;
}) {
  const t = useTranslations("Goals");
  const tSports = useTranslations("Activities.sports");
  const [open, setOpen] = useState(startOpen);
  const [sport, setSport] = useState<GoalSport>("run");
  const [distance, setDistance] = useState(5000);
  const [race, setRace] = useState<TriathlonRace>("half");
  const [time, setTime] = useState("");
  const [splits, setSplits] = useState<SplitInputs>(EMPTY_SPLITS);
  const [clientError, setClientError] = useState<string | null>(null);

  const [state, action, pending] = useActionState(
    async (prev: GoalFormState, formData: FormData) => {
      const result = await createGoal(prev, formData);
      if (result.status === "saved") {
        setTime("");
        setSplits(EMPTY_SPLITS);
        setOpen(false);
      }
      return result;
    },
    idle,
  );

  if (!open) {
    return (
      <Button size="lg" className="self-start" onClick={() => setOpen(true)}>
        <Plus />
        {t("add")}
      </Button>
    );
  }

  const bestFor = (of: EffortSport, meters: number) =>
    bests.find((b) => b.sport === of && b.distance === distanceKey(meters))
      ?.seconds;
  const best = sport === "triathlon" ? undefined : bestFor(sport, distance);

  const serverError =
    state.status === "error"
      ? state.error === "notFaster"
        ? t("errors.notFaster", { time: formatClock(state.best ?? 0) })
        : t(`errors.${state.error}`)
      : null;

  /** Client check before sending; the server checks again. */
  const validate = (): string | null => {
    if (sport === "triathlon") {
      if (LEGS.some((leg) => !parseClock(splits[leg]))) {
        return t("errors.timeInvalid");
      }
      if (
        splits.transitions.trim() &&
        parseClock(splits.transitions) === null
      ) {
        return t("errors.timeInvalid");
      }
      return null;
    }
    const target = parseClock(time);
    if (!target) return t("errors.timeInvalid");
    if (!isTargetAllowed(target, best)) {
      return t("errors.notFaster", { time: formatClock(best ?? 0) });
    }
    return null;
  };

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const error = validate();
        if (error) event.preventDefault();
        setClientError(error);
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
              const next = event.target.value as GoalSport;
              setSport(next);
              if (next !== "triathlon") {
                setDistance(
                  distanceKey(
                    EFFORT_DISTANCES[next][1] ?? EFFORT_DISTANCES[next][0],
                  ),
                );
              }
              setTime("");
            }}
            className={selectClass}
          >
            {EFFORT_SPORTS.map((option) => (
              <option key={option} value={option}>
                {tSports(option)}
              </option>
            ))}
            <option value="triathlon">{t("triathlon.name")}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-distance">{t("form.distance")}</Label>
          {sport === "triathlon" ? (
            <select
              id="goal-distance"
              name="race"
              value={race}
              onChange={(event) => setRace(event.target.value as TriathlonRace)}
              className={selectClass}
            >
              {TRIATHLON_RACES.map((option) => (
                <option key={option} value={option}>
                  {t(`triathlon.${option}`)} (
                  {LEGS.map((leg) =>
                    legLabel(distanceLabels, leg, TRIATHLONS[option].legs[leg]),
                  ).join(" · ")}
                  )
                </option>
              ))}
            </select>
          ) : (
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
          )}
        </div>
      </div>

      {sport === "triathlon" ? (
        <TriathlonFields
          race={race}
          splits={splits}
          onChange={setSplits}
          bestFor={bestFor}
          distanceLabels={distanceLabels}
          units={units}
        />
      ) : (
        <SingleFields
          sport={sport}
          distance={distance}
          best={best}
          time={time}
          onTime={setTime}
          units={units}
        />
      )}

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

function legLabel(
  labels: Record<string, string>,
  leg: Leg,
  meters: number,
): string {
  return labels[`${leg}-${distanceKey(meters)}`] ?? "";
}

/** "= 3:37 /km" for a typed time, or nothing while it isn't a valid time yet. */
function LivePace({
  sport,
  meters,
  value,
  units,
}: {
  sport: EffortSport;
  meters: number;
  value: string;
  units: Units;
}) {
  const seconds = parseClock(value);
  const pace = seconds ? formatSportPace(sport, meters, seconds, units) : null;
  return (
    <span className="text-sm text-muted-foreground tabular-nums">
      {pace ? `= ${pace}` : ""}
    </span>
  );
}

function SingleFields({
  sport,
  distance,
  best,
  time,
  onTime,
  units,
}: {
  sport: EffortSport;
  distance: number;
  best: number | undefined;
  time: string;
  onTime: (value: string) => void;
  units: Units;
}) {
  const t = useTranslations("Goals");
  const pace = (seconds: number) =>
    formatSportPace(sport, distance, seconds, units) ?? "";
  const suggestions = best ? suggestTargets(best) : [];
  return (
    <>
      <div className="flex flex-col gap-2 text-sm">
        {best ? (
          <>
            <p className="tabular-nums">
              {t("form.currentBest", {
                time: formatClock(best),
                pace: pace(best),
              })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">
                {t("form.suggestions")}:
              </span>
              {suggestions.map((suggestion) => {
                const label = formatClock(suggestion);
                const selected = time === label;
                return (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onTime(label)}
                    className={cn(
                      "rounded-full border px-3 py-1 tabular-nums transition-colors",
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "hover:bg-muted",
                    )}
                  >
                    <span className="font-medium">{label}</span>
                    <span
                      className={cn(
                        "ml-1.5 text-xs",
                        selected
                          ? "text-background/75"
                          : "text-muted-foreground",
                      )}
                    >
                      {pace(suggestion)}
                    </span>
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
        <span className="flex items-center gap-3">
          <Input
            id="goal-time"
            name="time"
            required
            inputMode="numeric"
            value={time}
            onChange={(event) => onTime(event.target.value)}
            placeholder={t("form.targetPlaceholder")}
            className="w-40"
          />
          <LivePace
            sport={sport}
            meters={distance}
            value={time}
            units={units}
          />
        </span>
      </div>
    </>
  );
}

/** A time per discipline with its pace and the best at that distance, plus transitions and the total. */
function TriathlonFields({
  race,
  splits,
  onChange,
  bestFor,
  distanceLabels,
  units,
}: {
  race: TriathlonRace;
  splits: SplitInputs;
  onChange: (splits: SplitInputs) => void;
  bestFor: (sport: EffortSport, meters: number) => number | undefined;
  distanceLabels: Record<string, string>;
  units: Units;
}) {
  const t = useTranslations("Goals");
  const tSports = useTranslations("Activities.sports");
  const parsed = [...LEGS, "transitions" as const].map((key) =>
    splits[key].trim() ? parseClock(splits[key]) : 0,
  );
  const total = parsed.every((value) => value !== null)
    ? parsed.reduce<number>((sum, value) => sum + (value ?? 0), 0)
    : null;

  return (
    <div className="flex flex-col gap-3">
      {LEGS.map((leg) => {
        const meters = TRIATHLONS[race].legs[leg];
        const best = bestFor(leg, meters);
        const id = `goal-${leg}`;
        return (
          <div key={leg} className="flex flex-col gap-1.5">
            <Label htmlFor={id}>
              {tSports(leg)} · {legLabel(distanceLabels, leg, meters)}
            </Label>
            <span className="flex items-center gap-3">
              <Input
                id={id}
                name={leg}
                required
                inputMode="numeric"
                value={splits[leg]}
                onChange={(event) =>
                  onChange({ ...splits, [leg]: event.target.value })
                }
                placeholder={t(`triathlon.placeholder.${leg}`)}
                className="w-40"
              />
              <LivePace
                sport={leg}
                meters={meters}
                value={splits[leg]}
                units={units}
              />
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {best
                ? t("form.currentBest", {
                    time: formatClock(best),
                    pace: formatSportPace(leg, meters, best, units) ?? "",
                  })
                : t("triathlon.noBest")}
            </span>
          </div>
        );
      })}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="goal-transitions">
          {t("triathlon.transitionsField")}
        </Label>
        <Input
          id="goal-transitions"
          name="transitions"
          inputMode="numeric"
          value={splits.transitions}
          onChange={(event) =>
            onChange({ ...splits, transitions: event.target.value })
          }
          placeholder={t("triathlon.placeholder.transitions")}
          className="w-40"
        />
      </div>
      <p className="text-sm font-medium tabular-nums">
        {t("triathlon.total", {
          time: total ? formatClock(total) : "–",
        })}
      </p>
    </div>
  );
}
