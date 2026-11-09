/** Stramin's sport categories (SPT-1). */
export const SPORTS = ["swim", "bike", "run", "strength", "other"] as const;
export type Sport = (typeof SPORTS)[number];

const STRAVA_SPORT_MAP: Record<string, Sport> = {
  Run: "run",
  TrailRun: "run",
  VirtualRun: "run",
  Ride: "bike",
  VirtualRide: "bike",
  GravelRide: "bike",
  MountainBikeRide: "bike",
  Swim: "swim",
  WeightTraining: "strength",
};

/** Maps a Strava `sport_type` to a Stramin sport (SPT-2). Unknown types, e-bikes and CrossFit → other. */
export function sportFromStrava(sportType: string): Sport {
  return STRAVA_SPORT_MAP[sportType] ?? "other";
}

/** Indoor = virtual activities or activities recorded on a trainer/treadmill (SPT-3). */
export function isIndoorStrava(sportType: string, trainer: boolean): boolean {
  return trainer || sportType.startsWith("Virtual");
}
