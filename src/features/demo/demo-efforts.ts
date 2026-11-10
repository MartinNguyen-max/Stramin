import type { Goal } from "@/features/goals/data";
import {
  type BestEffort,
  type EffortActivity,
  estimateBestEfforts,
  mergeBestEfforts,
} from "@/lib/analytics/best-efforts";
import { bestPowerAcross, type PowerBest } from "@/lib/analytics/power";
import { loadDemoActivities } from "./demo-activities";

/**
 * Demo best efforts: estimated from the demo history (with a few short pauses on runs), a "manual"
 * 5 km race like a real user would add, and power from the indoor rides.
 */
export async function demoBestEfforts(): Promise<{
  efforts: BestEffort[];
  activities: EffortActivity[];
  power: PowerBest[];
}> {
  const activities: EffortActivity[] = (await loadDemoActivities()).map(
    (activity) => ({
      ...activity,
      elapsedSeconds: Math.round(activity.movingSeconds * 1.02),
    }),
  );
  const efforts = mergeBestEfforts(estimateBestEfforts(activities), [
    { sport: "run", distance: 5000, seconds: 20 * 60 + 41, date: "2026-05-17" },
  ]);

  // Indoor rides have power: a steady rider with an FTP of about 270 W.
  const rides = activities
    .filter((activity) => activity.sport === "bike" && activity.indoor)
    .map((activity, index) => {
      const form = 0.9 + ((index * 37) % 10) / 100;
      return {
        id: activity.id,
        startLocal: activity.startLocal,
        powerBests: {
          "60": Math.round(400 * form),
          "300": Math.round(330 * form),
          "1200": Math.round(285 * form),
          "3600": Math.round(255 * form),
        },
      };
    });
  return { efforts, activities, power: bestPowerAcross(rides) };
}

/** Demo goals: one close, one bigger, one on the bike. */
export const DEMO_GOALS: Goal[] = [
  { id: "demo-goal-1", sport: "run", distance: 10_000, target: 42 * 60 },
  { id: "demo-goal-2", sport: "run", distance: 21_098, target: 95 * 60 },
  { id: "demo-goal-3", sport: "bike", distance: 40_000, target: 70 * 60 },
];
