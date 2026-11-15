import { EFFORT_SPORTS, type EffortSport } from "@/lib/analytics/best-efforts";
import type { PaceTarget } from "@/lib/analytics/running";
import { type PersonalPaces, stepPace, withDefaults } from "./plan";
import {
  type Amount,
  type Step,
  type Target,
  type TemplateId,
  WORKOUTS,
  type Workout,
} from "./workouts";
import type { Zone } from "./zones";

/**
 * The workout builder (owner feedback 2026-11-15): the user picks a sport, how long and how hard, and
 * gets 4–6 suggestions that fill exactly that time. Each suggestion comes from a template; long
 * sessions keep the hard part at a sensible size and fill the rest with easy endurance.
 * Workouts are built in seconds; swims are turned into meters with the user's swim pace.
 */

/** How hard: the catalog's three groups, or a mix of easy and hard parts. */
export const CREATE_EFFORTS = ["easy", "moderate", "hard", "mixed"] as const;
export type CreateEffort = (typeof CREATE_EFFORTS)[number];

/** Durations in minutes: every 15 min up to 2:30 h, then every 30 min up to 5:30 h (swims up to 2 h). */
const SHORT_DURATIONS = [30, 45, 60, 75, 90, 105, 120, 135, 150];
const LONG_DURATIONS = [180, 210, 240, 270, 300, 330];

export function durationsFor(sport: EffortSport): number[] {
  return sport === "swim"
    ? SHORT_DURATIONS.filter((minutes) => minutes <= 120)
    : [...SHORT_DURATIONS, ...LONG_DURATIONS];
}

/** How hard a part is, the same for every sport; turned into a pace (run) or a zone (bike, swim). */
type Intensity = "recovery" | "easy" | "tempo" | "threshold" | "vo2" | "sprint";

const RUN_PACE: Record<Intensity, PaceTarget> = {
  recovery: "recovery",
  easy: "easy",
  tempo: "marathon",
  threshold: "threshold",
  vo2: "interval",
  sprint: "repetition",
};

const ZONE: Record<Intensity, Zone> = {
  recovery: 1,
  easy: 2,
  tempo: 3,
  threshold: 4,
  vo2: 5,
  sprint: 5,
};

type Block = { seconds: number; intensity: Intensity };
type Draft = (
  | ({ type: "warmup" | "main" | "easy" | "cooldown" } & Block)
  | { type: "repeat"; reps: number; work: Block; rest: Block }
)[];

type Template = {
  id: TemplateId;
  effort: CreateEffort;
  sports?: readonly EffortSport[];
  build: (minutes: number, sport: EffortSport) => Draft | null;
};

const MIN = 60;
const block = (minutes: number, intensity: Intensity): Block => ({
  seconds: Math.round(minutes * MIN),
  intensity,
});
const roundToMinute = (seconds: number) => Math.round(seconds / MIN) * MIN;
/** Rounds minutes to a multiple of 5 and keeps them between min and max. */
const round5 = (minutes: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(minutes / 5) * 5));

const warmupMinutes = (minutes: number) =>
  minutes <= 30 ? 7 : minutes <= 45 ? 10 : minutes <= 90 ? 15 : 20;
const cooldownMinutes = (minutes: number) =>
  minutes <= 30 ? 3 : minutes <= 45 ? 5 : 10;
/** Minutes between the warm-up and the cool-down. */
const middleMinutes = (minutes: number) =>
  minutes - warmupMinutes(minutes) - cooldownMinutes(minutes);

function draftSeconds(draft: Draft): number {
  return draft.reduce(
    (sum, step) =>
      sum +
      (step.type === "repeat"
        ? step.reps * step.work.seconds + (step.reps - 1) * step.rest.seconds
        : step.seconds),
    0,
  );
}

/**
 * Warm-up, the core, easy endurance for the time that's left, cool-down: `minutes` long in total.
 * Null when the core doesn't fit.
 */
function frame(minutes: number, core: Draft): Draft | null {
  const warmup = warmupMinutes(minutes) * MIN;
  let cooldown = cooldownMinutes(minutes) * MIN;
  const left = minutes * MIN - warmup - cooldown - draftSeconds(core);
  if (left < 0) return null;
  const draft: Draft = [
    { type: "warmup", seconds: warmup, intensity: "easy" },
    ...core,
  ];
  if (left >= 5 * MIN) {
    draft.push({
      type: "easy",
      seconds: roundToMinute(left),
      intensity: "easy",
    });
  } else {
    cooldown += left;
  }
  draft.push({
    type: "cooldown",
    seconds: roundToMinute(cooldown),
    intensity: "recovery",
  });
  return draft;
}

/** Interval sizes in minutes per sport: work, rest and how many repeats (min–max). */
type Spec = { work: number; rest: number; min: number; max: number };
type SportSpecs = Partial<Record<EffortSport, Spec>>;

/** As many repeats as fit between the warm-up and the cool-down (up to `max`), framed. */
function intervals(
  minutes: number,
  spec: Spec | undefined,
  work: Intensity,
  rest: Intensity = "recovery",
): Draft | null {
  if (!spec) return null;
  const available = middleMinutes(minutes);
  const reps = Math.min(
    spec.max,
    Math.floor((available + spec.rest) / (spec.work + spec.rest)),
  );
  if (reps < spec.min) return null;
  return frame(minutes, [
    {
      type: "repeat",
      reps,
      work: block(spec.work, work),
      rest: block(spec.rest, rest),
    },
  ]);
}

const TEMPO_INTERVALS: SportSpecs = {
  run: { work: 8, rest: 2, min: 2, max: 7 },
  bike: { work: 12, rest: 4, min: 2, max: 5 },
  swim: { work: 5, rest: 0.5, min: 3, max: 10 },
};
const FARTLEK: SportSpecs = {
  run: { work: 3, rest: 2, min: 4, max: 10 },
  bike: { work: 4, rest: 2, min: 3, max: 10 },
  swim: { work: 2, rest: 1, min: 4, max: 10 },
};
const LONG_BLOCKS: SportSpecs = {
  run: { work: 20, rest: 5, min: 2, max: 3 },
  bike: { work: 20, rest: 10, min: 2, max: 4 },
  swim: { work: 10, rest: 1, min: 2, max: 4 },
};
const THRESHOLD: SportSpecs = {
  run: { work: 8, rest: 2, min: 2, max: 6 },
  bike: { work: 8, rest: 3, min: 2, max: 6 },
  swim: { work: 4, rest: 0.5, min: 3, max: 10 },
};
const VO2: SportSpecs = {
  run: { work: 4, rest: 3, min: 3, max: 6 },
  bike: { work: 4, rest: 4, min: 3, max: 6 },
  swim: { work: 2, rest: 0.75, min: 4, max: 10 },
};
const ONE_ONE: SportSpecs = {
  run: { work: 1, rest: 1, min: 6, max: 12 },
  bike: { work: 1, rest: 1, min: 6, max: 12 },
  swim: { work: 1, rest: 0.5, min: 6, max: 12 },
};
const THIRTY_THIRTY: SportSpecs = {
  run: { work: 0.5, rest: 0.5, min: 10, max: 20 },
  bike: { work: 0.5, rest: 0.5, min: 10, max: 20 },
  swim: { work: 0.5, rest: 0.5, min: 8, max: 16 },
};

/** The order is the order shown; the first six that fit are suggested. */
const TEMPLATES: Template[] = [
  // Easy · Z1–Z2
  {
    id: "steady",
    effort: "easy",
    build: (minutes) => [{ type: "main", ...block(minutes, "easy") }],
  },
  {
    id: "strides",
    effort: "easy",
    build: (minutes, sport) => {
      const reps = minutes < 60 ? 6 : 8;
      const rest = sport === "swim" ? 40 : 60;
      const set = reps * 20 + (reps - 1) * rest;
      const main = minutes * MIN - set - 5 * MIN;
      if (main < 15 * MIN) return null;
      return [
        { type: "main", seconds: roundToMinute(main), intensity: "easy" },
        {
          type: "repeat",
          reps,
          work: { seconds: 20, intensity: "sprint" },
          rest: { seconds: rest, intensity: "recovery" },
        },
        { type: "cooldown", ...block(5, "recovery") },
      ];
    },
  },
  {
    id: "gentle-build",
    effort: "easy",
    build: (minutes) => {
      const first = Math.round(minutes / 3);
      return [
        { type: "warmup", ...block(first, "recovery") },
        { type: "main", ...block(minutes - first, "easy") },
      ];
    },
  },
  {
    id: "easy-blocks",
    effort: "easy",
    build: (minutes, sport) => {
      const reps = minutes < 60 ? 3 : minutes < 120 ? 4 : 6;
      const rest = sport === "swim" ? 0.5 : 2;
      const work = Math.floor((minutes - (reps - 1) * rest) / reps);
      const draft: Draft = [
        {
          type: "repeat",
          reps,
          work: block(work, "easy"),
          rest: block(rest, "recovery"),
        },
      ];
      const left = minutes * MIN - draftSeconds(draft);
      if (left >= MIN) {
        draft.push({
          type: "cooldown",
          seconds: roundToMinute(left),
          intensity: "recovery",
        });
      }
      return draft;
    },
  },
  // Moderate · Z3
  {
    id: "tempo",
    effort: "moderate",
    build: (minutes) => {
      const middle = middleMinutes(minutes);
      if (middle < 15) return null;
      return frame(minutes, [
        { type: "main", ...block(round5(middle / 2, 15, 60), "tempo") },
      ]);
    },
  },
  {
    id: "tempo-intervals",
    effort: "moderate",
    build: (minutes, sport) =>
      intervals(minutes, TEMPO_INTERVALS[sport], "tempo"),
  },
  {
    id: "progression",
    effort: "moderate",
    build: (minutes) => {
      const easy = Math.round(minutes * 0.55);
      const tempo = Math.round(minutes * 0.35);
      return [
        { type: "main", ...block(easy, "easy") },
        { type: "main", ...block(tempo, "tempo") },
        { type: "cooldown", ...block(minutes - easy - tempo, "recovery") },
      ];
    },
  },
  {
    id: "fartlek",
    effort: "moderate",
    build: (minutes, sport) =>
      intervals(minutes, FARTLEK[sport], "tempo", "easy"),
  },
  {
    id: "long-blocks",
    effort: "moderate",
    build: (minutes, sport) =>
      minutes < 75 ? null : intervals(minutes, LONG_BLOCKS[sport], "tempo"),
  },
  // Hard · Z4–Z5
  {
    id: "threshold",
    effort: "hard",
    build: (minutes, sport) =>
      intervals(minutes, THRESHOLD[sport], "threshold"),
  },
  {
    id: "vo2",
    effort: "hard",
    build: (minutes, sport) => intervals(minutes, VO2[sport], "vo2"),
  },
  {
    id: "one-one",
    effort: "hard",
    build: (minutes, sport) => intervals(minutes, ONE_ONE[sport], "vo2"),
  },
  {
    id: "thirty-thirty",
    effort: "hard",
    build: (minutes, sport) => intervals(minutes, THIRTY_THIRTY[sport], "vo2"),
  },
  {
    id: "pyramid",
    effort: "hard",
    sports: ["run", "bike"],
    build: (minutes) => {
      const core: Draft = [];
      [1, 2, 3, 4, 3, 2, 1].forEach((work, index) => {
        if (index > 0) core.push({ type: "easy", ...block(2, "recovery") });
        core.push({
          type: "main",
          ...block(work, work >= 3 ? "threshold" : "vo2"),
        });
      });
      return frame(minutes, core);
    },
  },
  // Mixed · Z2–Z5
  {
    id: "tempo-fast-finish",
    effort: "mixed",
    build: (minutes) => {
      const middle = middleMinutes(minutes);
      const tempo = round5(middle * 0.4, 10, 40);
      const reps = Math.min(8, Math.floor((middle - tempo - 3 + 1) / 2));
      if (reps < 4) return null;
      return frame(minutes, [
        { type: "main", ...block(tempo, "tempo") },
        { type: "easy", ...block(3, "recovery") },
        {
          type: "repeat",
          reps,
          work: block(1, "vo2"),
          rest: block(1, "recovery"),
        },
      ]);
    },
  },
  {
    id: "surges",
    effort: "mixed",
    build: (minutes) =>
      intervals(minutes, { work: 1, rest: 9, min: 2, max: 12 }, "vo2", "easy"),
  },
  {
    id: "build-to-hard",
    effort: "mixed",
    build: (minutes) => {
      const middle = middleMinutes(minutes);
      if (middle < 20) return null;
      const threshold = round5(middle * 0.2, 5, 20);
      const tempo = round5(middle * 0.3, 10, 40);
      const easy = middle - threshold - tempo;
      if (easy < 0) return null;
      return frame(minutes, [
        ...(easy >= 5
          ? [{ type: "easy" as const, ...block(easy, "easy") }]
          : []),
        { type: "main", ...block(tempo, "tempo") },
        { type: "main", ...block(threshold, "threshold") },
      ]);
    },
  },
  {
    id: "tempo-vo2",
    effort: "mixed",
    build: (minutes) => {
      const middle = middleMinutes(minutes);
      const tempo = round5(middle * 0.35, 10, 30);
      const reps = Math.min(6, Math.floor((middle - tempo - 3 + 2) / 5));
      if (reps < 3) return null;
      return frame(minutes, [
        { type: "main", ...block(tempo, "tempo") },
        { type: "easy", ...block(3, "recovery") },
        {
          type: "repeat",
          reps,
          work: block(3, "vo2"),
          rest: block(2, "recovery"),
        },
      ]);
    },
  },
];

const TEMPLATE_IDS = new Set<string>(TEMPLATES.map((template) => template.id));

function targetFor(sport: EffortSport, intensity: Intensity): Target {
  return sport === "run"
    ? { pace: RUN_PACE[intensity] }
    : { zone: ZONE[intensity] };
}

/**
 * A part's amount: time for run and bike. Swims are meters at the user's pace (rounded to 25, 50 or
 * 100 m); rests between repeats stay seconds (standing at the wall).
 */
function amountFor(
  sport: EffortSport,
  part: Block,
  paces: PersonalPaces,
  wallRest = false,
): Amount {
  if (sport !== "swim" || wallRest) return { seconds: part.seconds };
  const per100 =
    stepPace("swim", targetFor(sport, part.intensity), paces) ?? 130;
  const meters = (part.seconds / per100) * 100;
  const unit = meters < 100 ? 25 : meters < 1000 ? 50 : 100;
  return { meters: Math.max(25, Math.round(meters / unit) * unit) };
}

function toSteps(
  draft: Draft,
  sport: EffortSport,
  paces: PersonalPaces,
): Step[] {
  return draft.map((step): Step => {
    if (step.type === "repeat") {
      return {
        type: "repeat",
        reps: step.reps,
        work: {
          amount: amountFor(sport, step.work, paces),
          target: targetFor(sport, step.work.intensity),
        },
        rest: {
          amount: amountFor(
            sport,
            step.rest,
            paces,
            step.rest.intensity === "recovery",
          ),
          target: targetFor(sport, step.rest.intensity),
        },
      };
    }
    return {
      type: step.type,
      amount: amountFor(sport, step, paces),
      target: targetFor(sport, step.intensity),
    };
  });
}

function build(
  template: Template,
  sport: EffortSport,
  minutes: number,
  paces: PersonalPaces,
): Workout | null {
  if (template.sports && !template.sports.includes(sport)) return null;
  const draft = template.build(minutes, sport);
  if (!draft) return null;
  return {
    id: `${sport}.${template.id}.${minutes}`,
    sport,
    effort: template.effort,
    steps: toSteps(draft, sport, withDefaults(paces)),
    text: `templates.${template.id}`,
  };
}

/** Up to six suggestions for a sport, a duration (minutes) and an effort. */
export function suggestWorkouts(
  sport: EffortSport,
  minutes: number,
  effort: CreateEffort,
  paces: PersonalPaces,
): Workout[] {
  if (!durationsFor(sport).includes(minutes)) return [];
  return TEMPLATES.filter((template) => template.effort === effort)
    .map((template) => build(template, sport, minutes, paces))
    .filter((workout): workout is Workout => workout !== null)
    .slice(0, 6);
}

/** A workout from its id: a catalog workout, or a created one ("run.vo2.60"). Null if unknown. */
export function workoutById(id: string, paces: PersonalPaces): Workout | null {
  const catalog = WORKOUTS.find((workout) => workout.id === id);
  if (catalog) return catalog;
  const [sport, templateId, minutesText, ...rest] = id.split(".");
  const minutes = Number(minutesText);
  if (
    rest.length > 0 ||
    !(EFFORT_SPORTS as readonly string[]).includes(sport) ||
    !TEMPLATE_IDS.has(templateId) ||
    !durationsFor(sport as EffortSport).includes(minutes)
  ) {
    return null;
  }
  const template = TEMPLATES.find((t) => t.id === templateId);
  return template
    ? build(template, sport as EffortSport, minutes, paces)
    : null;
}

/** Workout ids are short; anything longer isn't one (checked before touching the database). */
export const MAX_WORKOUT_ID_LENGTH = 64;

/** True for the efforts the builder offers (from the URL). */
export function isCreateEffort(value: string): value is CreateEffort {
  return (CREATE_EFFORTS as readonly string[]).includes(value);
}
