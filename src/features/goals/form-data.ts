import { effortDistanceLabel } from "@/features/profile/distance-label";
import {
  type BestEffort,
  distanceKey,
  EFFORT_DISTANCES,
  EFFORT_SPORTS,
  type EffortSport,
  isEffortDistance,
} from "@/lib/analytics/best-efforts";
import type { GoalSport } from "@/lib/db/schema/goals";
import { formatTimeDigits } from "@/lib/format";
import {
  LEGS,
  type Leg,
  TRIATHLON_RACES,
  type TriathlonRace,
} from "./triathlon";

/** Shared by the goal form and the calculator: labels, bests, and a goal filled in from a link. */

/** Labels by sport and integer distance, e.g. "run-21098" → "Half marathon". */
export function goalDistanceLabels(
  locale: string,
  names: { halfMarathon: string; marathon: string },
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const sport of EFFORT_SPORTS) {
    for (const meters of EFFORT_DISTANCES[sport]) {
      labels[`${sport}-${distanceKey(meters)}`] = effortDistanceLabel(
        sport,
        meters,
        locale,
        names,
      );
    }
  }
  return labels;
}

/** The bests as plain values for client components. */
export function plainBests(
  efforts: BestEffort[],
): { sport: EffortSport; distance: number; seconds: number }[] {
  return efforts.map((effort) => ({
    sport: effort.sport,
    distance: distanceKey(effort.distance),
    seconds: effort.seconds,
  }));
}

/** A goal to start the form with, from the calculator's "Set as goal" link. */
export type GoalDraft = {
  sport: GoalSport;
  distance?: number;
  time?: string;
  race?: TriathlonRace;
  splits?: Partial<Record<Leg | "transitions", string>>;
};

/** Reads a draft from the URL; anything invalid is left out. */
export function draftFromParams(
  params: Record<string, string | string[] | undefined>,
): GoalDraft | null {
  const first = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : undefined;
  };
  const time = (key: string) => {
    const value = first(key);
    return value ? formatTimeDigits(value) : undefined;
  };
  const sport = first("sport");
  if (sport === "triathlon") {
    const race = first("race");
    if (!race || !(TRIATHLON_RACES as readonly string[]).includes(race)) {
      return null;
    }
    return {
      sport,
      race: race as TriathlonRace,
      splits: Object.fromEntries(
        [...LEGS, "transitions"].map((key) => [key, time(key) ?? ""]),
      ),
    };
  }
  if (!sport || !(EFFORT_SPORTS as readonly string[]).includes(sport)) {
    return null;
  }
  const distance = Number(first("distance"));
  return {
    sport: sport as EffortSport,
    distance: isEffortDistance(sport as EffortSport, distance)
      ? distance
      : undefined,
    time: time("time"),
  };
}
