import type { EffortSport } from "@/lib/analytics/best-efforts";
import type { PaceTarget } from "@/lib/analytics/running";
import type messages from "@/messages/en.json";
import type { Effort, Zone } from "./zones";

/**
 * The training catalog (TRN-1..5): static content in code (ARCHITECTURE: data model).
 * PLACEHOLDERS written by Claude (2026-11-10); the owner replaces them with their own workouts.
 * Names and descriptions are translated in `Training.workouts.<id>`.
 */

/** How long a step is: a distance or a time. */
export type Amount = { meters: number } | { seconds: number };

/** What a step aims for: a running pace (VDOT, ADR 0010) or a heart-rate zone (bike, swim). */
export type Target = { pace: PaceTarget } | { zone: Zone };

export type Step =
  | { type: "warmup" | "cooldown" | "main"; amount: Amount; target: Target }
  | {
      type: "repeat";
      reps: number;
      work: { amount: Amount; target: Target };
      rest?: { amount: Amount; target: Target };
    };

/** Every workout has a name and description in the messages (Training.workouts). */
export type WorkoutId = keyof (typeof messages)["Training"]["workouts"];

export type Workout = {
  id: WorkoutId;
  sport: EffortSport;
  effort: Effort;
  steps: Step[];
};

const min = (minutes: number): Amount => ({ seconds: minutes * 60 });
const sec = (seconds: number): Amount => ({ seconds });
const m = (meters: number): Amount => ({ meters });
const km = (kilometers: number): Amount => ({ meters: kilometers * 1000 });

const easyWarmup: Step = {
  type: "warmup",
  amount: min(15),
  target: { pace: "easy" },
};
const easyCooldown: Step = {
  type: "cooldown",
  amount: min(10),
  target: { pace: "easy" },
};

export const WORKOUTS: Workout[] = [
  // Run · easy (Z1–Z2)
  {
    id: "easy-run",
    sport: "run",
    effort: "easy",
    steps: [{ type: "main", amount: min(45), target: { pace: "easy" } }],
  },
  {
    id: "long-run",
    sport: "run",
    effort: "easy",
    steps: [{ type: "main", amount: km(16), target: { pace: "easy" } }],
  },
  {
    id: "recovery-strides",
    sport: "run",
    effort: "easy",
    steps: [
      { type: "main", amount: min(30), target: { pace: "recovery" } },
      {
        type: "repeat",
        reps: 6,
        work: { amount: sec(20), target: { pace: "repetition" } },
        rest: { amount: sec(60), target: { pace: "recovery" } },
      },
    ],
  },
  // Run · moderate (Z3)
  {
    id: "marathon-pace",
    sport: "run",
    effort: "moderate",
    steps: [
      { type: "warmup", amount: km(2), target: { pace: "easy" } },
      { type: "main", amount: km(8), target: { pace: "marathon" } },
      { type: "cooldown", amount: km(2), target: { pace: "easy" } },
    ],
  },
  {
    id: "progression-run",
    sport: "run",
    effort: "moderate",
    steps: [
      { type: "main", amount: km(6), target: { pace: "easy" } },
      { type: "main", amount: km(4), target: { pace: "marathon" } },
      { type: "cooldown", amount: km(1), target: { pace: "recovery" } },
    ],
  },
  {
    id: "long-run-mp",
    sport: "run",
    effort: "moderate",
    steps: [
      { type: "warmup", amount: km(3), target: { pace: "easy" } },
      {
        type: "repeat",
        reps: 3,
        work: { amount: km(3), target: { pace: "marathon" } },
        rest: { amount: km(1), target: { pace: "easy" } },
      },
      { type: "cooldown", amount: km(2), target: { pace: "easy" } },
    ],
  },
  // Run · hard (Z4–Z5)
  {
    id: "intervals-400",
    sport: "run",
    effort: "hard",
    steps: [
      easyWarmup,
      {
        type: "repeat",
        reps: 12,
        work: { amount: m(400), target: { pace: "repetition" } },
        rest: { amount: m(200), target: { pace: "recovery" } },
      },
      easyCooldown,
    ],
  },
  {
    id: "intervals-1k",
    sport: "run",
    effort: "hard",
    steps: [
      easyWarmup,
      {
        type: "repeat",
        reps: 5,
        work: { amount: m(1000), target: { pace: "interval" } },
        rest: { amount: min(2), target: { pace: "recovery" } },
      },
      easyCooldown,
    ],
  },
  {
    id: "cruise-intervals",
    sport: "run",
    effort: "hard",
    steps: [
      easyWarmup,
      {
        type: "repeat",
        reps: 4,
        work: { amount: min(8), target: { pace: "threshold" } },
        rest: { amount: min(1), target: { pace: "recovery" } },
      },
      easyCooldown,
    ],
  },
  // Bike (placeholders, zones only)
  {
    id: "bike-endurance",
    sport: "bike",
    effort: "easy",
    steps: [{ type: "main", amount: min(120), target: { zone: 2 } }],
  },
  {
    id: "bike-tempo",
    sport: "bike",
    effort: "moderate",
    steps: [
      { type: "warmup", amount: min(15), target: { zone: 2 } },
      {
        type: "repeat",
        reps: 3,
        work: { amount: min(12), target: { zone: 3 } },
        rest: { amount: min(4), target: { zone: 1 } },
      },
      { type: "cooldown", amount: min(10), target: { zone: 1 } },
    ],
  },
  {
    id: "bike-vo2",
    sport: "bike",
    effort: "hard",
    steps: [
      { type: "warmup", amount: min(15), target: { zone: 2 } },
      {
        type: "repeat",
        reps: 5,
        work: { amount: min(4), target: { zone: 5 } },
        rest: { amount: min(4), target: { zone: 1 } },
      },
      { type: "cooldown", amount: min(10), target: { zone: 1 } },
    ],
  },
  {
    id: "bike-recovery",
    sport: "bike",
    effort: "easy",
    steps: [{ type: "main", amount: min(45), target: { zone: 1 } }],
  },
  {
    id: "bike-sweet-spot",
    sport: "bike",
    effort: "moderate",
    steps: [
      { type: "warmup", amount: min(15), target: { zone: 2 } },
      {
        type: "repeat",
        reps: 3,
        work: { amount: min(15), target: { zone: 3 } },
        rest: { amount: min(5), target: { zone: 1 } },
      },
      { type: "cooldown", amount: min(10), target: { zone: 1 } },
    ],
  },
  {
    id: "bike-long-tempo",
    sport: "bike",
    effort: "moderate",
    steps: [
      { type: "main", amount: min(60), target: { zone: 2 } },
      { type: "main", amount: min(30), target: { zone: 3 } },
      { type: "main", amount: min(60), target: { zone: 2 } },
    ],
  },
  {
    id: "bike-ftp-2x20",
    sport: "bike",
    effort: "hard",
    steps: [
      { type: "warmup", amount: min(15), target: { zone: 2 } },
      {
        type: "repeat",
        reps: 2,
        work: { amount: min(20), target: { zone: 4 } },
        rest: { amount: min(5), target: { zone: 1 } },
      },
      { type: "cooldown", amount: min(10), target: { zone: 1 } },
    ],
  },
  {
    id: "bike-over-unders",
    sport: "bike",
    effort: "hard",
    steps: [
      { type: "warmup", amount: min(15), target: { zone: 2 } },
      {
        type: "repeat",
        reps: 6,
        work: { amount: min(3), target: { zone: 4 } },
        rest: { amount: min(1), target: { zone: 5 } },
      },
      { type: "main", amount: min(5), target: { zone: 1 } },
      {
        type: "repeat",
        reps: 6,
        work: { amount: min(3), target: { zone: 4 } },
        rest: { amount: min(1), target: { zone: 5 } },
      },
      { type: "cooldown", amount: min(10), target: { zone: 1 } },
    ],
  },
  {
    id: "bike-sprints",
    sport: "bike",
    effort: "hard",
    steps: [
      { type: "warmup", amount: min(20), target: { zone: 2 } },
      {
        type: "repeat",
        reps: 10,
        work: { amount: sec(30), target: { zone: 5 } },
        rest: { amount: sec(270), target: { zone: 1 } },
      },
      { type: "cooldown", amount: min(10), target: { zone: 1 } },
    ],
  },
  // Swim (placeholders)
  {
    id: "swim-technique",
    sport: "swim",
    effort: "easy",
    steps: [
      { type: "warmup", amount: m(400), target: { zone: 2 } },
      {
        type: "repeat",
        reps: 8,
        work: { amount: m(50), target: { zone: 2 } },
        rest: { amount: sec(15), target: { zone: 1 } },
      },
      { type: "main", amount: m(800), target: { zone: 2 } },
      { type: "cooldown", amount: m(200), target: { zone: 1 } },
    ],
  },
  {
    id: "swim-aerobic",
    sport: "swim",
    effort: "moderate",
    steps: [
      { type: "warmup", amount: m(400), target: { zone: 2 } },
      {
        type: "repeat",
        reps: 5,
        work: { amount: m(300), target: { zone: 3 } },
        rest: { amount: sec(30), target: { zone: 1 } },
      },
      { type: "cooldown", amount: m(200), target: { zone: 1 } },
    ],
  },
  {
    id: "swim-threshold",
    sport: "swim",
    effort: "hard",
    steps: [
      { type: "warmup", amount: m(400), target: { zone: 2 } },
      {
        type: "repeat",
        reps: 10,
        work: { amount: m(100), target: { zone: 4 } },
        rest: { amount: sec(15), target: { zone: 1 } },
      },
      {
        type: "repeat",
        reps: 4,
        work: { amount: m(50), target: { zone: 5 } },
        rest: { amount: sec(30), target: { zone: 1 } },
      },
      { type: "cooldown", amount: m(200), target: { zone: 1 } },
    ],
  },
  {
    id: "swim-endurance",
    sport: "swim",
    effort: "easy",
    steps: [
      { type: "warmup", amount: m(400), target: { zone: 2 } },
      { type: "main", amount: m(1500), target: { zone: 2 } },
      { type: "cooldown", amount: m(200), target: { zone: 1 } },
    ],
  },
  {
    id: "swim-pyramid",
    sport: "swim",
    effort: "moderate",
    steps: [
      { type: "warmup", amount: m(400), target: { zone: 2 } },
      { type: "main", amount: m(100), target: { zone: 3 } },
      { type: "main", amount: m(200), target: { zone: 3 } },
      { type: "main", amount: m(300), target: { zone: 3 } },
      { type: "main", amount: m(400), target: { zone: 3 } },
      { type: "main", amount: m(300), target: { zone: 3 } },
      { type: "main", amount: m(200), target: { zone: 3 } },
      { type: "main", amount: m(100), target: { zone: 4 } },
      { type: "cooldown", amount: m(200), target: { zone: 1 } },
    ],
  },
  {
    id: "swim-sprints",
    sport: "swim",
    effort: "hard",
    steps: [
      { type: "warmup", amount: m(400), target: { zone: 2 } },
      {
        type: "repeat",
        reps: 12,
        work: { amount: m(50), target: { zone: 5 } },
        rest: { amount: sec(30), target: { zone: 1 } },
      },
      { type: "cooldown", amount: m(300), target: { zone: 1 } },
    ],
  },
];

export function workoutsFor(sport: EffortSport, effort?: Effort): Workout[] {
  return WORKOUTS.filter(
    (workout) =>
      workout.sport === sport && (!effort || workout.effort === effort),
  );
}
