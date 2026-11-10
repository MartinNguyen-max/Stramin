/**
 * Running model (ADR 0010): VDOT from Jack Daniels' Running Formula, using the Daniels–Gilbert equations.
 * Gives the runner's level from a best effort, race equivalents and training paces. Pure functions.
 */

/** Oxygen cost (ml/kg/min) of running at `v` meters per minute. */
export function oxygenCost(v: number): number {
  return -4.6 + 0.182258 * v + 0.000104 * v * v;
}

/** Share of VO2max that can be held for `minutes`. */
export function shareOfMax(minutes: number): number {
  return (
    0.8 +
    0.1894393 * Math.exp(-0.012778 * minutes) +
    0.2989558 * Math.exp(-0.1932605 * minutes)
  );
}

/** VDOT for running `meters` in `seconds`. */
export function vdot(meters: number, seconds: number): number {
  const minutes = seconds / 60;
  return oxygenCost(meters / minutes) / shareOfMax(minutes);
}

/** Speed in meters per minute that costs `vo2` (the inverse of oxygenCost). */
export function speedAtVo2(vo2: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.6 - vo2;
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

/** The time (seconds) for `meters` at the same VDOT: a race equivalent (GOAL-6). */
export function equivalentTime(level: number, meters: number): number {
  // VDOT falls as the time grows, so search for the time between "very fast" and "very slow".
  let fast = meters / 600; // minutes at 10 m/s
  let slow = meters / 40; // minutes at 0.67 m/s
  for (let i = 0; i < 80; i++) {
    const middle = (fast + slow) / 2;
    if (vdot(meters, middle * 60) > level) {
      fast = middle;
    } else {
      slow = middle;
    }
  }
  return ((fast + slow) / 2) * 60;
}

/** Seconds per km at a share of VDOT. */
function paceAt(level: number, share: number): number {
  return (1000 / speedAtVo2(level * share)) * 60;
}

/** Training paces in seconds per km. Ranges are [slower, faster]. */
export type TrainingPaces = {
  recovery: [number, number];
  easy: [number, number];
  marathon: number;
  threshold: number;
  interval: number;
  repetition: number;
};

export const MARATHON_METERS = 42_195;

/** The five classic training paces (plus recovery) for a VDOT (TRN-3, ADR 0010). */
export function trainingPaces(level: number): TrainingPaces {
  return {
    recovery: [paceAt(level, 0.55), paceAt(level, 0.62)],
    easy: [paceAt(level, 0.62), paceAt(level, 0.7)],
    marathon: (equivalentTime(level, MARATHON_METERS) / MARATHON_METERS) * 1000,
    threshold: paceAt(level, 0.88),
    interval: paceAt(level, 0.975),
    repetition: paceAt(level, 1.05),
  };
}

/** The pace targets a workout step can ask for, and their heart-rate zone. */
export const PACE_ZONES = {
  recovery: 1,
  easy: 2,
  marathon: 3,
  threshold: 4,
  interval: 5,
  repetition: 5,
} as const;
export type PaceTarget = keyof typeof PACE_ZONES;

/** Seconds per km for a pace target. Ranges use their middle. */
export function paceFor(paces: TrainingPaces, target: PaceTarget): number {
  const value = paces[target];
  return Array.isArray(value) ? (value[0] + value[1]) / 2 : value;
}

/** Running efforts shorter than this aren't used for VDOT (too sprint-like for the model). */
const MIN_VDOT_METERS = 1500;

/** The runner's level: the highest VDOT across their running best efforts of 1.5 km and longer. */
export function bestVdot(
  efforts: { distance: number; seconds: number }[],
): { level: number; distance: number; seconds: number } | null {
  let best: { level: number; distance: number; seconds: number } | null = null;
  for (const effort of efforts) {
    if (effort.distance < MIN_VDOT_METERS || effort.seconds <= 0) continue;
    const level = vdot(effort.distance, effort.seconds);
    if (!best || level > best.level) {
      best = { level, distance: effort.distance, seconds: effort.seconds };
    }
  }
  return best;
}

/** Riegel's formula, used for bike and swim equivalents (ADR 0010): T2 = T1 × (D2 / D1)^1.06. */
export function riegel(seconds: number, from: number, to: number): number {
  return seconds * (to / from) ** 1.06;
}

/**
 * The bike or swim effort that predicts the fastest times with Riegel's formula (owner feedback
 * 2026-11-11, P5): the lowest seconds ÷ distance^1.06. The same effort wins for every target distance,
 * like the highest VDOT does for running.
 */
export function strongestRiegelEffort<
  T extends { distance: number; seconds: number },
>(efforts: T[]): T | null {
  let best: T | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const effort of efforts) {
    if (effort.distance <= 0 || effort.seconds <= 0) continue;
    const score = effort.seconds / effort.distance ** 1.06;
    if (score < bestScore) {
      best = effort;
      bestScore = score;
    }
  }
  return best;
}
