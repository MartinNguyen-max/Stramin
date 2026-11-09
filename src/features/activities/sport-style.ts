import type { Sport } from "@/lib/analytics/sports";

/**
 * One fixed color per sport, used everywhere (UI_SPEC: global UI rules).
 * Taken from the brand's heart-rate zone colors.
 */
export const SPORT_BG: Record<Sport, string> = {
  swim: "bg-zone-1",
  bike: "bg-zone-2",
  run: "bg-zone-5",
  strength: "bg-zone-3",
  other: "bg-muted-foreground/40",
};

/** Sports shown as distance in averages. Strength (and other) are shown as time (HOME-3). */
export const DISTANCE_SPORTS = ["swim", "bike", "run"] as const;
