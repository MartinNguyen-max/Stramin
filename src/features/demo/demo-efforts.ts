import type { Goal } from "@/features/goals/data";
import {
  type BestEffort,
  estimateBestEfforts,
  mergeBestEfforts,
} from "@/lib/analytics/best-efforts";
import type { CalendarActivity } from "@/lib/analytics/calendar";
import { loadDemoActivities } from "./demo-activities";

/** Demo best efforts: estimated from the demo history, plus a "manual" 5 km race, like a real user. */
export async function demoBestEfforts(): Promise<{
  efforts: BestEffort[];
  activities: CalendarActivity[];
}> {
  const activities = await loadDemoActivities();
  const efforts = mergeBestEfforts(estimateBestEfforts(activities), [
    { sport: "run", distance: 5000, seconds: 20 * 60 + 41, date: "2026-05-17" },
  ]);
  return { efforts, activities };
}

/** Demo goals: one close, one bigger, one on the bike. */
export const DEMO_GOALS: Goal[] = [
  { id: "demo-goal-1", sport: "run", distance: 10_000, target: 42 * 60 },
  { id: "demo-goal-2", sport: "run", distance: 21_098, target: 95 * 60 },
  { id: "demo-goal-3", sport: "bike", distance: 40_000, target: 70 * 60 },
];
