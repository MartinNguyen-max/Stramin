"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useId, useLayoutEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import {
  distanceKey,
  EFFORT_DISTANCES,
  EFFORT_SPORTS,
  type EffortSport,
} from "@/lib/analytics/best-efforts";
import { formatClock, formatTimeGap } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import {
  freshTime,
  LEGS,
  type Leg,
  legBasis,
  RACE_DAY_FACTOR,
  raceDayTime,
  TRIATHLON_RACES,
  TRIATHLONS,
  type TriathlonRace,
} from "../triathlon";

type Best = { sport: EffortSport; distance: number; seconds: number };
type CalcSport = EffortSport | "triathlon";

const METERS_PER_MILE = 1609.344;
const METERS_PER_YARD = 0.9144;

/**
 * What the slider moves, per sport: seconds per km (mi) for runs, km/h (mph) for bikes, seconds per
 * 100 m (100 yd) for swims. The time follows from the distance.
 */
type Scale = {
  min: number;
  max: number;
  step: number;
  start: number;
  /** Slider value → seconds over `meters`. */
  time: (value: number, meters: number) => number;
  /** Seconds over `meters` → slider value. */
  value: (seconds: number, meters: number) => number;
  label: (value: number) => string;
};

function scaleFor(sport: EffortSport, units: Units): Scale {
  const imperial = units === "imperial";
  if (sport === "run") {
    const unit = imperial ? METERS_PER_MILE : 1000;
    return {
      ...(imperial
        ? { min: 240, max: 780, start: 480 }
        : { min: 150, max: 480, start: 300 }),
      step: 5,
      time: (pace, meters) => (meters / unit) * pace,
      value: (seconds, meters) => (seconds / meters) * unit,
      label: (pace) => `${formatClock(pace)} /${imperial ? "mi" : "km"}`,
    };
  }
  if (sport === "bike") {
    const unit = imperial ? METERS_PER_MILE : 1000;
    return {
      ...(imperial
        ? { min: 10, max: 35, start: 18 }
        : { min: 15, max: 55, start: 30 }),
      step: 0.5,
      time: (speed, meters) => (meters / unit / speed) * 3600,
      value: (seconds, meters) => (meters / unit / seconds) * 3600,
      label: (speed) => `${speed.toFixed(1)} ${imperial ? "mph" : "km/h"}`,
    };
  }
  const unit = imperial ? 100 * METERS_PER_YARD : 100;
  return {
    min: 55,
    max: 240,
    step: 1,
    start: 120,
    time: (pace, meters) => (meters / unit) * pace,
    value: (seconds, meters) => (seconds / meters) * unit,
    label: (pace) => `${formatClock(pace)} /100${imperial ? "yd" : "m"}`,
  };
}

/** Keeps a value on the slider. */
function onScale(scale: Scale, value: number): number {
  const stepped = Math.round(value / scale.step) * scale.step;
  return Math.min(scale.max, Math.max(scale.min, stepped));
}

/**
 * The pace calculator (owner feedback 2026-11-12): any sport or a triathlon. Pick a distance, move the
 * pace (or speed), and see the finish time next to your own best, green when faster and red when
 * slower. "Set as goal" opens the goal form with it filled in.
 */
export function Calculator({
  bests,
  distanceLabels,
  units,
  goalsBase,
}: {
  bests: Best[];
  /** Labels by sport and integer distance, e.g. "run-21098" → "Half marathon". */
  distanceLabels: Record<string, string>;
  units: Units;
  /** Where "Set as goal" goes; null hides it (the demo). */
  goalsBase: "/goals" | null;
}) {
  const t = useTranslations("Goals.calculator");
  const tSports = useTranslations("Activities.sports");
  const tTri = useTranslations("Goals.triathlon");
  const [sport, setSport] = useState<CalcSport>("run");

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{t("sport")}</legend>
        {[...EFFORT_SPORTS, "triathlon" as const].map((option) => (
          <Chip
            key={option}
            selected={sport === option}
            onClick={() => setSport(option)}
          >
            {option === "triathlon" ? tTri("name") : tSports(option)}
          </Chip>
        ))}
      </fieldset>

      {sport === "triathlon" ? (
        <TriathlonCalculator
          bests={bests}
          units={units}
          goalsBase={goalsBase}
        />
      ) : (
        <SportCalculator
          key={sport}
          sport={sport}
          bests={bests}
          distanceLabels={distanceLabels}
          units={units}
          goalsBase={goalsBase}
        />
      )}
    </div>
  );
}

function SportCalculator({
  sport,
  bests,
  distanceLabels,
  units,
  goalsBase,
}: {
  sport: EffortSport;
  bests: Best[];
  distanceLabels: Record<string, string>;
  units: Units;
  goalsBase: "/goals" | null;
}) {
  const t = useTranslations("Goals.calculator");
  const id = useId();
  const scale = scaleFor(sport, units);
  const distances = EFFORT_DISTANCES[sport];
  const startFor = (meters: number) => {
    const fresh = freshTime(sport, meters, bests);
    return fresh
      ? onScale(scale, scale.value(fresh.seconds, meters))
      : scale.start;
  };

  const [meters, setMeters] = useState<number>(distances[1] ?? distances[0]);
  const [custom, setCustom] = useState<string | null>(null);
  const [value, setValue] = useState(() => startFor(meters));

  const customMeters =
    custom === null
      ? null
      : Number(custom.replace(",", ".")) * (sport === "swim" ? 1 : 1000);
  const distance =
    customMeters !== null && customMeters > 0 ? customMeters : meters;
  const time = scale.time(value, distance);
  const fresh = freshTime(sport, distance, bests);
  const tracked = custom === null;

  const pick = (next: number) => {
    setMeters(next);
    setCustom(null);
    setValue(startFor(next));
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="sr-only">{t("distance")}</legend>
        {distances.map((option) => (
          <Chip
            key={option}
            selected={tracked && meters === option}
            onClick={() => pick(option)}
          >
            {distanceLabels[`${sport}-${distanceKey(option)}`]}
          </Chip>
        ))}
        <Chip selected={!tracked} onClick={() => setCustom("")}>
          {t("other")}
        </Chip>
        {!tracked && (
          <span className="flex items-center gap-2">
            <Input
              aria-label={t(sport === "swim" ? "customM" : "customKm")}
              inputMode="decimal"
              value={custom ?? ""}
              onChange={(event) => setCustom(event.target.value)}
              className="h-8 w-24"
              autoFocus
            />
            <span className="text-sm text-muted-foreground">
              {sport === "swim" ? "m" : "km"}
            </span>
          </span>
        )}
      </fieldset>

      <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Slider
          id={id}
          label={t(sport === "bike" ? "speed" : "pace")}
          scale={scale}
          value={value}
          onChange={setValue}
        />
        <div className="flex flex-col items-start gap-0.5 rounded-xl bg-muted/50 px-4 py-3 sm:items-end">
          <span className="text-xs text-muted-foreground">{t("finish")}</span>
          <span className="text-3xl font-bold tabular-nums">
            {formatClock(time)}
          </span>
        </div>
      </div>

      <Comparison time={time} fresh={fresh} scale={scale} meters={distance} />

      {goalsBase && tracked && (
        <Link
          href={{
            pathname: goalsBase,
            query: {
              sport,
              distance: distanceKey(meters),
              time: formatClock(Math.round(time)),
            },
          }}
          className={cn(buttonVariants({ variant: "outline" }), "self-start")}
        >
          {t("setGoal")}
        </Link>
      )}
    </section>
  );
}

function TriathlonCalculator({
  bests,
  units,
  goalsBase,
}: {
  bests: Best[];
  units: Units;
  goalsBase: "/goals" | null;
}) {
  const t = useTranslations("Goals.calculator");
  const tTri = useTranslations("Goals.triathlon");
  const tSports = useTranslations("Activities.sports");
  const [race, setRace] = useState<TriathlonRace>("half");
  const [transitions, setTransitions] = useState(6 * 60);
  const startFor = (next: TriathlonRace) =>
    Object.fromEntries(
      LEGS.map((leg) => {
        const meters = TRIATHLONS[next].legs[leg];
        const scale = scaleFor(leg, units);
        const basis = legBasis(next, leg, meters, bests);
        return [
          leg,
          basis === null
            ? scale.start
            : onScale(scale, scale.value(basis, meters)),
        ];
      }),
    ) as Record<Leg, number>;
  const [values, setValues] = useState(() => startFor("half"));

  const legs = LEGS.map((leg) => {
    const meters = TRIATHLONS[race].legs[leg];
    const scale = scaleFor(leg, units);
    const fresh = freshTime(leg, meters, bests);
    return {
      leg,
      meters,
      scale,
      time: scale.time(values[leg], meters),
      fresh,
      raceDay: fresh ? raceDayTime(race, leg, fresh.seconds) : null,
    };
  });
  const total = legs.reduce((sum, leg) => sum + leg.time, 0) + transitions;
  const raceDayTotal = legs.every((leg) => leg.raceDay !== null)
    ? legs.reduce((sum, leg) => sum + (leg.raceDay ?? 0), 0) + transitions
    : null;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{t("distance")}</legend>
        {TRIATHLON_RACES.map((option) => (
          <Chip
            key={option}
            selected={race === option}
            onClick={() => {
              setRace(option);
              setValues(startFor(option));
            }}
          >
            {tTri(option)}
          </Chip>
        ))}
      </fieldset>

      <ul className="flex flex-col divide-y rounded-xl border">
        {legs.map((leg) => (
          <li key={leg.leg} className="flex flex-col gap-2 p-3">
            <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
              <Slider
                id={`calc-${leg.leg}`}
                label={`${tSports(leg.leg)} · ${formatDistanceLabel(leg.leg, leg.meters)}`}
                scale={leg.scale}
                value={values[leg.leg]}
                onChange={(value) => setValues({ ...values, [leg.leg]: value })}
              />
              <span className="text-xl font-bold tabular-nums sm:text-right">
                {formatClock(leg.time)}
              </span>
            </div>
            <Comparison
              time={leg.time}
              fresh={
                leg.raceDay === null || leg.fresh === null
                  ? null
                  : { seconds: leg.raceDay, predicted: leg.fresh.predicted }
              }
              scale={leg.scale}
              meters={leg.meters}
              raceDay={
                leg.fresh === null
                  ? undefined
                  : {
                      distance: formatDistanceLabel(leg.leg, leg.meters),
                      fresh: leg.fresh.seconds,
                      fatigue: Math.round(
                        (RACE_DAY_FACTOR[race][leg.leg] - 1) * 100,
                      ),
                    }
              }
            />
          </li>
        ))}
        <li className="p-3">
          <Slider
            id="calc-transitions"
            label={tTri("transitions")}
            scale={{
              min: 0,
              max: 1800,
              step: 15,
              start: 360,
              time: (value) => value,
              value: (seconds) => seconds,
              label: (value) => formatClock(value),
            }}
            value={transitions}
            onChange={setTransitions}
          />
        </li>
      </ul>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">{t("finish")}</span>
          <span className="text-3xl font-bold tabular-nums">
            {formatClock(total)}
          </span>
        </div>
        {raceDayTotal !== null && (
          <Difference
            time={total}
            reference={raceDayTotal}
            raceDay
            predicted={legs.some((leg) => leg.fresh?.predicted)}
          />
        )}
      </div>

      {goalsBase && (
        <Link
          href={{
            pathname: goalsBase,
            query: {
              sport: "triathlon",
              race,
              swim: formatClock(Math.round(legs[0].time)),
              bike: formatClock(Math.round(legs[1].time)),
              run: formatClock(Math.round(legs[2].time)),
              transitions: formatClock(transitions),
            },
          }}
          className={cn(buttonVariants({ variant: "outline" }), "self-start")}
        >
          {t("setGoal")}
        </Link>
      )}
    </section>
  );
}

/** "1.9 km", "90 km", "21.1 km" for the triathlon legs. */
function formatDistanceLabel(leg: Leg, meters: number): string {
  return leg === "swim" && meters < 1000
    ? `${meters} m`
    : `${Number((meters / 1000).toFixed(2))} km`;
}

/**
 * The best (or predicted) time at the distance and how far the chosen time is from it, in time and in
 * pace (owner feedback 2026-11-12, batch 6). In the triathlon calculator it's the time on race day,
 * and an info button explains where it comes from: a real best or a predicted one, plus fatigue.
 */
function Comparison({
  time,
  fresh,
  scale,
  meters,
  raceDay,
}: {
  time: number;
  fresh: { seconds: number; predicted: boolean } | null;
  scale: Scale;
  meters: number;
  /** Triathlon only: the fresh time behind the race-day time, and the fatigue added in %. */
  raceDay?: { distance: string; fresh: number; fatigue: number };
}) {
  const t = useTranslations("Goals.calculator");
  const [info, setInfo] = useState(false);
  // Closed again when you leave the page (owner feedback 2026-11-12, batch 6).
  useLayoutEffect(() => () => setInfo(false), []);
  if (!fresh) {
    return <p className="text-sm text-muted-foreground">{t("noBest")}</p>;
  }
  const key = raceDay
    ? fresh.predicted
      ? "raceDayPredicted"
      : "raceDay"
    : fresh.predicted
      ? "predicted"
      : "best";
  const pace = scale.value(fresh.seconds, meters);
  return (
    <div className="flex flex-col gap-1 text-sm tabular-nums">
      <p className="flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
        {t(key, {
          time: formatClock(fresh.seconds),
          pace: scale.label(pace),
        })}
        {raceDay && (
          <button
            type="button"
            onClick={() => setInfo(!info)}
            aria-expanded={info}
            aria-label={t("howCalculated")}
            className="rounded-full p-0.5 hover:bg-muted hover:text-foreground"
          >
            <Info className="size-4" />
          </button>
        )}
      </p>
      {raceDay && info && (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {t(fresh.predicted ? "infoPredicted" : "infoBest", {
            distance: raceDay.distance,
            time: formatClock(raceDay.fresh),
          })}{" "}
          {raceDay.fatigue > 0
            ? t("infoFatigue", { percent: raceDay.fatigue })
            : t("infoNoFatigue")}
        </p>
      )}
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Difference
          time={time}
          reference={fresh.seconds}
          raceDay={raceDay !== undefined}
          predicted={fresh.predicted}
        />
        <PaceDifference
          value={scale.value(time, meters)}
          reference={pace}
          scale={scale}
          faster={time < fresh.seconds}
        />
      </p>
    </div>
  );
}

/** "0:14 /km faster", "1.5 km/h slower": the same gap as the time, per km (or 100 m, or as speed). */
function PaceDifference({
  value,
  reference,
  scale,
  faster,
}: {
  value: number;
  reference: number;
  scale: Scale;
  faster: boolean;
}) {
  const t = useTranslations("Goals.calculator");
  const diff = Math.abs(value - reference);
  // Below the precision we show ("0:00 /km", "0.0 km/h"), there's nothing to say.
  if (scale.label(diff) === scale.label(0)) return null;
  return (
    <span
      className={cn(
        "font-medium",
        faster
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400",
      )}
    >
      {t(faster ? "fasterPace" : "slowerPace", { diff: scale.label(diff) })}
    </span>
  );
}

/** Green "1:12 min faster", red "25 s slower", or "same". */
function Difference({
  time,
  reference,
  raceDay = false,
  predicted = false,
}: {
  time: number;
  reference: number;
  raceDay?: boolean;
  predicted?: boolean;
}) {
  const t = useTranslations("Goals.calculator");
  const tUnits = useTranslations("Units");
  const diff = Math.round(time - reference);
  const compared = raceDay
    ? predicted
      ? "RaceDayPredicted"
      : "RaceDay"
    : predicted
      ? "Predicted"
      : "Best";
  if (diff === 0) {
    return <span className="font-medium">{t("same")}</span>;
  }
  const gap = formatTimeGap(diff, tUnits("hour"));
  return diff < 0 ? (
    <span className="font-semibold text-green-600 dark:text-green-400">
      {t(`faster${compared}`, { diff: gap })}
    </span>
  ) : (
    <span className="font-semibold text-red-600 dark:text-red-400">
      {t(`slower${compared}`, { diff: gap })}
    </span>
  );
}

function Slider({
  id,
  label,
  scale,
  value,
  onChange,
}: {
  id: string;
  label: string;
  scale: Scale;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label}:{" "}
        <span className="font-semibold tabular-nums">{scale.label(value)}</span>
      </Label>
      <input
        id={id}
        type="range"
        min={scale.min}
        max={scale.max}
        step={scale.step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-foreground"
      />
      <span className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{scale.label(scale.min)}</span>
        <span>{scale.label(scale.max)}</span>
      </span>
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        selected
          ? "border-foreground bg-foreground text-background"
          : "hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
