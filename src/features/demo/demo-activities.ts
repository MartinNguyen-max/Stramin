import type { CalendarActivity } from "@/lib/analytics/calendar";
import type { Sport } from "@/lib/analytics/sports";
import { addDays, today, weekday } from "@/lib/dates";

/**
 * Made-up training for the demo page (/demo): a triathlete's typical week with some randomness.
 * Deterministic: the same day always gets the same workouts, so the demo is stable between visits.
 */

/** The demo history starts here ("all time"). */
export const DEMO_START = "2024-01-01";

/** Demo activity ids start with this, so they don't link to Strava. */
export const DEMO_ID_PREFIX = "demo-";

/** Small seeded random generator (mulberry32). */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

const NAMES: Record<Sport, string[]> = {
  run: [
    "Morning run",
    "Aarhus run",
    "Easy run",
    "Intervals 6 × 1 km",
    "Tempo run",
  ],
  bike: [
    "Zwift – Watopia",
    "Virtual ride – Dubai",
    "Gravel loop",
    "Group ride",
  ],
  swim: ["Pool swim", "Technique swim", "Swim 10 × 100 m"],
  strength: ["Strength", "Core & mobility"],
  other: ["Walk"],
};

type Plan = {
  sport: Sport;
  name?: string;
  /** Distance range in km (swim: meters / 1000). */
  km?: [number, number];
  /** Pace range: min/km for run, km/h for bike, min/100 m for swim. */
  pace?: [number, number];
  /** Duration range in minutes, for sports without distance. */
  minutes?: [number, number];
  chance: number;
};

/** Plans per weekday (0 = Sunday). */
const WEEK: Plan[][] = [
  [
    {
      sport: "run",
      name: "Long run",
      km: [14, 22],
      pace: [5.1, 5.6],
      chance: 0.6,
    },
    { sport: "swim", km: [1.5, 2.5], pace: [1.9, 2.2], chance: 0.4 },
  ],
  [
    { sport: "run", km: [8, 14], pace: [4.9, 5.5], chance: 0.85 },
    { sport: "bike", km: [25, 55], pace: [28, 33], chance: 0.5 },
  ],
  [
    { sport: "bike", km: [30, 70], pace: [28, 34], chance: 0.8 },
    { sport: "run", km: [5, 8], pace: [5.0, 5.5], chance: 0.4 },
  ],
  [
    { sport: "swim", km: [1.0, 2.0], pace: [1.9, 2.2], chance: 0.8 },
    { sport: "run", km: [5, 7], pace: [4.6, 5.2], chance: 0.4 },
  ],
  [{ sport: "bike", km: [25, 45], pace: [27, 32], chance: 0.6 }],
  [{ sport: "run", km: [8, 12], pace: [4.8, 5.4], chance: 0.6 }],
  [
    { sport: "strength", minutes: [40, 95], chance: 0.5 },
    {
      sport: "bike",
      name: "Long ride",
      km: [60, 140],
      pace: [27, 31],
      chance: 0.6,
    },
  ],
];

function between(next: () => number, [min, max]: [number, number]) {
  return min + next() * (max - min);
}

/** The demo workouts of one day. */
export function demoActivitiesOn(date: string): CalendarActivity[] {
  const next = random(hash(date));
  if (next() < 0.08) return []; // a rest day now and then
  const activities: CalendarActivity[] = [];

  for (const plan of WEEK[weekday(date)]) {
    if (next() > plan.chance) continue;
    const names = NAMES[plan.sport];
    const name = plan.name ?? names[Math.floor(next() * names.length)];
    let meters = 0;
    let seconds: number;
    if (plan.km && plan.pace) {
      const km = between(next, plan.km);
      const pace = between(next, plan.pace);
      meters = Math.round(km * 1000);
      seconds =
        plan.sport === "bike"
          ? (km / pace) * 3600
          : plan.sport === "swim"
            ? km * 10 * pace * 60
            : km * pace * 60;
    } else {
      seconds = between(next, plan.minutes ?? [30, 60]) * 60;
    }
    const hour = activities.length === 0 ? 7 : 17;
    activities.push({
      id: `${DEMO_ID_PREFIX}${date}-${activities.length}`,
      name,
      sport: plan.sport,
      startLocal: `${date}T${String(hour).padStart(2, "0")}:${String(Math.floor(next() * 60)).padStart(2, "0")}:00Z`,
      movingSeconds: Math.round(seconds),
      distanceMeters: meters,
      indoor: name.startsWith("Zwift") || name.startsWith("Virtual"),
    });
  }
  return activities;
}

/** Demo workouts in a range of days (inclusive), or the whole demo history. Never in the future. */
export async function loadDemoActivities(range?: {
  from: string;
  to: string;
}): Promise<CalendarActivity[]> {
  const last = today();
  const from = range && range.from > DEMO_START ? range.from : DEMO_START;
  const to = range && range.to < last ? range.to : last;
  const activities: CalendarActivity[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    activities.push(...demoActivitiesOn(date));
  }
  return activities;
}
