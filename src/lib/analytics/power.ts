/**
 * Bike power (BE-3): best average watts over fixed durations, from a ride's power stream. Pure functions.
 */

/** 1 min, 5 min, 20 min, 60 min. 20 minutes is the classic FTP test. */
export const POWER_DURATIONS = [60, 300, 1200, 3600] as const;

/** FTP is estimated as 95 % of the best 20-minute power. */
export const FTP_SHARE = 0.95;

/**
 * Best average watts for each duration. The stream is resampled to one value per second (each sample
 * holds until the next), so rides with gaps or irregular recording are handled.
 */
export function bestPowers(
  time: number[],
  watts: number[],
  durations: readonly number[] = POWER_DURATIONS,
): Record<string, number> {
  const result: Record<string, number> = {};
  if (time.length < 2 || time.length !== watts.length) return result;

  const total = Math.floor(time.at(-1) ?? 0);
  const perSecond = new Float64Array(total);
  for (let i = 0; i < time.length; i++) {
    const from = Math.floor(time[i]);
    const to = i + 1 < time.length ? Math.floor(time[i + 1]) : total;
    const value = Number.isFinite(watts[i]) ? Math.max(0, watts[i]) : 0;
    for (let t = from; t < to && t < total; t++) perSecond[t] = value;
  }

  // Prefix sums make every window an O(1) lookup.
  const prefix = new Float64Array(total + 1);
  for (let t = 0; t < total; t++) prefix[t + 1] = prefix[t] + perSecond[t];

  for (const duration of durations) {
    if (duration > total) continue;
    let best = 0;
    for (let start = 0; start + duration <= total; start++) {
      const sum = prefix[start + duration] - prefix[start];
      if (sum > best) best = sum;
    }
    result[String(duration)] = Math.round(best / duration);
  }
  return result;
}

export type PowerBest = {
  duration: number;
  watts: number;
  activityId: string;
  date: string;
};

/** The best value per duration across rides (BE-3). */
export function bestPowerAcross(
  rides: {
    id: string;
    startLocal: string;
    powerBests?: Record<string, number> | null;
  }[],
): PowerBest[] {
  const result: PowerBest[] = [];
  for (const duration of POWER_DURATIONS) {
    let best: PowerBest | undefined;
    for (const ride of rides) {
      const watts = ride.powerBests?.[String(duration)];
      if (watts && (!best || watts > best.watts)) {
        best = {
          duration,
          watts,
          activityId: ride.id,
          date: ride.startLocal.slice(0, 10),
        };
      }
    }
    if (best) result.push(best);
  }
  return result;
}
