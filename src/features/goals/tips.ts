import {
  type BestEffort,
  distanceKey,
  type EffortSport,
} from "@/lib/analytics/best-efforts";
import type { CalendarActivity } from "@/lib/analytics/calendar";
import { trainingPaces, vdot } from "@/lib/analytics/running";
import { type WeekStartDay, weekStartOf } from "@/lib/analytics/weekly";
import { addDays, daysBetween } from "@/lib/dates";
import { gapFor, recommendedVolume, speedCheck } from "./feedback";
import { LEGS, type Leg, type TriathlonRace } from "./triathlon";

/**
 * Training tips for a goal (owner feedback 2026-11-12: "only 1–3 good, relevant and specific tips,
 * and more behind a button"). Every tip gets a score from the user's own data, lowest first: a long
 * break or a big shortfall comes before general advice. The card shows the best 3, the rest on demand.
 * Based on the last 3 months (12 finished weeks) and well-known training principles. Pure, unit tested.
 */

/** How many finished weeks the stats look at (about 3 months), and the "recent" part of it. */
export const STATS_WEEKS = 12;
const RECENT_WEEKS = 4;

/** Sessions per week we suggest at least: how often you train moves you most. */
export const MIN_SESSIONS: Record<EffortSport, number> = {
  run: 3,
  bike: 2,
  swim: 2,
};

/** A break this long (days) means: come back gently first. */
const BREAK_DAYS = 14;

export type SportStats = {
  /** Over the last 12 weeks. */
  metersPerWeek: number;
  /** Over the last 4 of them. */
  recentMetersPerWeek: number;
  sessionsPerWeek: number;
  /** Weeks of the 12 with at least one session. */
  weeksTrained: number;
  /** The longest session in meters. */
  longest: number;
  /** Days since the last session (any time), or null without any. */
  daysSinceLast: number | null;
};

export type TrainingStats = Record<EffortSport, SportStats>;

function emptyStats(): SportStats {
  return {
    metersPerWeek: 0,
    recentMetersPerWeek: 0,
    sessionsPerWeek: 0,
    weeksTrained: 0,
    longest: 0,
    daysSinceLast: null,
  };
}

/** Per sport: distance and sessions per week, weeks trained, longest session, days since the last one. */
export function trainingStats(
  activities: CalendarActivity[],
  todayDate: string,
  weekStartDay: WeekStartDay,
): TrainingStats {
  const currentWeek = weekStartOf(todayDate, weekStartDay);
  const from = addDays(currentWeek, -7 * STATS_WEEKS);
  const recentFrom = addDays(currentWeek, -7 * RECENT_WEEKS);
  const stats: TrainingStats = {
    run: emptyStats(),
    bike: emptyStats(),
    swim: emptyStats(),
  };
  const weeks: Record<EffortSport, Set<string>> = {
    run: new Set(),
    bike: new Set(),
    swim: new Set(),
  };
  for (const activity of activities) {
    if (!(activity.sport in stats)) continue;
    const sport = activity.sport as EffortSport;
    const day = activity.startLocal.slice(0, 10);
    const s = stats[sport];
    if (day <= todayDate) {
      const days = daysBetween(day, todayDate);
      s.daysSinceLast =
        s.daysSinceLast === null ? days : Math.min(s.daysSinceLast, days);
    }
    if (day < from || day >= currentWeek) continue;
    s.metersPerWeek += activity.distanceMeters / STATS_WEEKS;
    s.sessionsPerWeek += 1 / STATS_WEEKS;
    s.longest = Math.max(s.longest, activity.distanceMeters);
    weeks[sport].add(weekStartOf(day, weekStartDay));
    if (day >= recentFrom) {
      s.recentMetersPerWeek += activity.distanceMeters / RECENT_WEEKS;
    }
  }
  for (const sport of Object.keys(stats) as EffortSport[]) {
    stats[sport].weeksTrained = weeks[sport].size;
  }
  return stats;
}

/** The long session that prepares for a goal distance, or null when the race is short enough. */
export function longSessionFor(
  sport: EffortSport,
  distance: number,
): number | null {
  const key = distanceKey(distance);
  if (sport === "run") {
    if (key >= 42_195) return 30_000;
    if (key >= 21_098) return 18_000;
    if (key >= 10_000) return 12_000;
    return null;
  }
  if (sport === "bike") {
    if (distance >= 90_000) return Math.round(distance * 0.75);
    if (distance >= 40_000) return 60_000;
    return null;
  }
  return distance >= 1900 ? distance : null;
}

/**
 * Weekly distance that fits a goal. Running grows with the goal's level (VDOT): about 1.5 km more per
 * VDOT point above 45, so a 1:20 half asks more than a 1:45 one. Rounded to 5 km (500 m for swims).
 */
export function targetVolume(
  sport: EffortSport,
  distance: number,
  target: number,
): number {
  if (sport !== "run") return recommendedVolume(sport, distance);
  const key = distanceKey(distance);
  const base = key <= 5000 ? 25 : key <= 10_000 ? 35 : key <= 21_098 ? 45 : 55;
  const km = Math.max(base * 0.6, base + 1.5 * (vdot(distance, target) - 45));
  return Math.round(km / 5) * 5000;
}

/**
 * Weekly distance per discipline that fits a triathlon, for amateurs (owner feedback 2026-11-12,
 * batch 6: 9 km of swimming a week was too much).
 */
const TRIATHLON_VOLUME: Record<TriathlonRace, Record<Leg, number>> = {
  quarter: { swim: 3000, bike: 80_000, run: 25_000 },
  half: { swim: 4500, bike: 130_000, run: 30_000 },
  full: { swim: 6000, bike: 180_000, run: 40_000 },
};

/** A value in a tip sentence; the card formats it. */
export type TipValue =
  | { kind: "distance"; sport: EffortSport; meters: number }
  | { kind: "label"; sport: EffortSport; meters: number }
  | { kind: "time"; seconds: number }
  | { kind: "runPace"; secondsPerKm: number }
  | { kind: "pace"; sport: EffortSport; meters: number; seconds: number }
  | { kind: "number"; value: number }
  | { kind: "sport"; sport: EffortSport };

type PerSport =
  | "volume"
  | "trend"
  | "frequency"
  | "consistency"
  | "comeback"
  | "longSession";

export type TipKey =
  | `${PerSport}.${EffortSport}`
  | "speedLimit"
  | "enduranceLimit"
  | "workout5k"
  | "workout10k"
  | "workoutHalf"
  | "workoutMarathon"
  | "fuelRun"
  | "workoutBikeShort"
  | "workoutBikeShortWatts"
  | "workoutBikeLong"
  | "workoutBikeLongWatts"
  | "fuelBike"
  | "workoutSwim"
  | "technique"
  | "openWater"
  | "gapClose"
  | "gapSeason"
  | "gapBig"
  | "easy"
  | "recoveryWeek";

export type Tip = {
  key: TipKey;
  /** Lower = more relevant. */
  score: number;
  values?: Record<string, TipValue>;
};

const dist = (sport: EffortSport, meters: number): TipValue => ({
  kind: "distance",
  sport,
  meters,
});

/** Tips from the user's own training in a sport (shared by single goals and triathlon legs). */
function trainingTips(
  sport: EffortSport,
  stats: SportStats,
  volumeTarget: number,
  longNeeded: number | null,
): Tip[] {
  const tips: Tip[] = [];
  if (stats.daysSinceLast !== null && stats.daysSinceLast >= BREAK_DAYS) {
    tips.push({
      key: `comeback.${sport}`,
      score: 0,
      values: { days: { kind: "number", value: stats.daysSinceLast } },
    });
  }
  const volumeShare = stats.metersPerWeek / volumeTarget;
  if (volumeShare < 0.85) {
    tips.push({
      key: `volume.${sport}`,
      score: volumeShare < 0.6 ? 1 : 2,
      values: {
        perWeek: dist(sport, stats.metersPerWeek),
        target: dist(sport, volumeTarget),
      },
    });
  }
  if (
    stats.metersPerWeek > 0 &&
    stats.recentMetersPerWeek < stats.metersPerWeek * 0.7
  ) {
    tips.push({
      key: `trend.${sport}`,
      score: 1.8,
      values: {
        recent: dist(sport, stats.recentMetersPerWeek),
        average: dist(sport, stats.metersPerWeek),
      },
    });
  }
  if (longNeeded !== null && stats.longest < longNeeded * 0.9) {
    tips.push({
      key: `longSession.${sport}`,
      score: stats.longest < longNeeded * 0.6 ? 1.5 : 2.5,
      values: {
        longest: dist(sport, stats.longest),
        needed: dist(sport, longNeeded),
      },
    });
  }
  if (stats.sessionsPerWeek < MIN_SESSIONS[sport] - 0.25) {
    tips.push({
      key: `frequency.${sport}`,
      score: 2.2,
      values: {
        count: {
          kind: "number",
          value: Math.round(stats.sessionsPerWeek * 2) / 2,
        },
        target: { kind: "number", value: MIN_SESSIONS[sport] },
      },
    });
  }
  if (stats.weeksTrained > 0 && stats.weeksTrained < STATS_WEEKS * 0.7) {
    tips.push({
      key: `consistency.${sport}`,
      score: 2.4,
      values: {
        weeks: { kind: "number", value: stats.weeksTrained },
        total: { kind: "number", value: STATS_WEEKS },
      },
    });
  }
  return tips;
}

/** The key session for a goal distance, with the user's paces for it. */
function workoutTips(
  sport: EffortSport,
  distance: number,
  target: number,
  ftp: number | null,
): Tip[] {
  const key = distanceKey(distance);
  if (sport === "run") {
    const paces = trainingPaces(vdot(distance, target));
    const runPace = (secondsPerKm: number): TipValue => ({
      kind: "runPace",
      secondsPerKm,
    });
    if (key <= 5000) {
      return [
        {
          key: "workout5k",
          score: 3,
          values: { pace: runPace(paces.interval) },
        },
      ];
    }
    if (key <= 10_000) {
      return [
        {
          key: "workout10k",
          score: 3,
          values: { pace: runPace(paces.threshold) },
        },
      ];
    }
    if (key <= 21_098) {
      return [
        {
          key: "workoutHalf",
          score: 3,
          values: { pace: runPace(paces.threshold) },
        },
      ];
    }
    return [
      {
        key: "workoutMarathon",
        score: 3,
        values: { pace: runPace((target / distance) * 1000) },
      },
      { key: "fuelRun", score: 3.3 },
    ];
  }
  if (sport === "bike") {
    const pace: TipValue = {
      kind: "pace",
      sport,
      meters: distance,
      seconds: target,
    };
    // Speed first (most ride outside without power); watts too when the user has an FTP.
    const watts = (share: number): TipValue => ({
      kind: "number",
      value: Math.round(((ftp ?? 0) * share) / 5) * 5,
    });
    if (distance <= 40_000) {
      return [
        ftp
          ? {
              key: "workoutBikeShortWatts",
              score: 3,
              values: { speed: pace, low: watts(0.95), high: watts(1) },
            }
          : { key: "workoutBikeShort", score: 3, values: { speed: pace } },
      ];
    }
    return [
      ftp
        ? {
            key: "workoutBikeLongWatts",
            score: 3,
            values: { low: watts(0.56), high: watts(0.75) },
          }
        : { key: "workoutBikeLong", score: 3 },
      { key: "fuelBike", score: 3.3 },
    ];
  }
  // Swim: 100 m repeats a little faster than goal pace.
  const per100 = (target / distance) * 100 - 3;
  const tips: Tip[] = [
    {
      key: "workoutSwim",
      score: 3,
      values: {
        pace: { kind: "pace", sport, meters: 100, seconds: per100 },
      },
    },
    { key: "technique", score: 4.2 },
  ];
  if (distance >= 1900) tips.push({ key: "openWater", score: 3.8 });
  return tips;
}

/** All tips for a single-sport goal, most relevant first. Empty when the goal is reached. */
export function goalTips(
  goal: { sport: EffortSport; distance: number; target: number },
  efforts: BestEffort[],
  stats: TrainingStats | null,
  /** The bike FTP in watts, when known (power meter or indoor rides). */
  ftp: number | null = null,
): Tip[] {
  const best = efforts.find(
    (effort) =>
      effort.sport === goal.sport &&
      distanceKey(effort.distance) === distanceKey(goal.distance),
  )?.seconds;
  if (best !== undefined && best <= goal.target) return [];

  const tips: Tip[] = [];
  const speed = speedCheck(goal.sport, goal.distance, goal.target, efforts);
  if (speed?.limiter === "speed" && speed.best !== undefined) {
    tips.push({
      key: "speedLimit",
      score: 1.2,
      values: {
        reference: { kind: "label", sport: "run", meters: speed.distance },
        best: { kind: "time", seconds: speed.best },
        needed: { kind: "time", seconds: speed.needed },
      },
    });
  }
  if (speed?.limiter === "endurance") {
    tips.push({
      key: "enduranceLimit",
      score: 2.6,
      values: {
        reference: { kind: "label", sport: "run", meters: speed.distance },
      },
    });
  }
  if (stats) {
    tips.push(
      ...trainingTips(
        goal.sport,
        stats[goal.sport],
        targetVolume(goal.sport, goal.distance, goal.target),
        longSessionFor(goal.sport, goal.distance),
      ),
    );
  }
  tips.push(...workoutTips(goal.sport, goal.distance, goal.target, ftp));
  if (best !== undefined) {
    const gap = gapFor(goal.target, best);
    if (gap.level === "close") tips.push({ key: "gapClose", score: 3.5 });
    if (gap.level === "season") tips.push({ key: "gapSeason", score: 3.5 });
    if (gap.level === "big" && gap.stepTarget) {
      tips.push({
        key: "gapBig",
        score: 3.4,
        values: { time: { kind: "time", seconds: gap.stepTarget } },
      });
    }
  }
  tips.push({ key: "easy", score: 5 }, { key: "recoveryWeek", score: 5.5 });
  return sortTips(tips);
}

/**
 * Triathlon tips (owner feedback 2026-11-12, batch 6: "keep it minimal"): only one volume line per
 * discipline, from the last 3 months, with a realistic next step instead of the full target at once.
 * In race order; disciplines that already train enough are left out.
 */
export function triathlonTips(
  race: TriathlonRace,
  stats: TrainingStats | null,
): Tip[] {
  if (!stats) return [];
  return LEGS.flatMap((leg): Tip[] => {
    const perWeek = stats[leg].metersPerWeek;
    const next = nextVolume(perWeek, TRIATHLON_VOLUME[race][leg]);
    if (next === null) return [];
    return [
      {
        key: `volume.${leg}`,
        score: 1,
        values: { perWeek: dist(leg, perWeek), target: dist(leg, next) },
      },
    ];
  });
}

/**
 * The next weekly distance to aim for: about 20 % more than now (at least 40 % of the target, so a
 * near-zero start still gets a useful number), never more than the target. Null when the volume is
 * already within 85 % of the target.
 */
export function nextVolume(perWeek: number, target: number): number | null {
  if (perWeek >= target * 0.85) return null;
  return Math.min(target, Math.max(perWeek * 1.2, target * 0.4));
}

/** Most relevant first, each key once. */
function sortTips(tips: Tip[]): Tip[] {
  const seen = new Set<TipKey>();
  return [...tips]
    .sort((a, b) => a.score - b.score)
    .filter((tip) => {
      if (seen.has(tip.key)) return false;
      seen.add(tip.key);
      return true;
    });
}
