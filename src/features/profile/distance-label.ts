import { distanceKey, type EffortSport } from "@/lib/analytics/best-efforts";

/** "5 km", "400 m", "1.9 km", "Half marathon" (BE-2). Race distances are shown in metric, as they're named. */
export function effortDistanceLabel(
  sport: EffortSport,
  meters: number,
  locale: string,
  names: { halfMarathon: string; marathon: string },
): string {
  if (sport === "run" && distanceKey(meters) === 21_098) {
    return names.halfMarathon;
  }
  if (sport === "run" && distanceKey(meters) === 42_195) return names.marathon;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return meters < 1000
    ? `${number.format(meters)} m`
    : `${number.format(meters / 1000)} km`;
}
