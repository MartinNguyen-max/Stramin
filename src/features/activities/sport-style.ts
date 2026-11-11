import {
  Activity,
  Bike,
  Dumbbell,
  Footprints,
  type LucideIcon,
  Waves,
} from "lucide-react";
import type { Sport } from "@/lib/analytics/sports";

/**
 * One fixed color per sport, used everywhere (UI_SPEC: global UI rules).
 * Taken from the brand's heart-rate zone colors.
 * Written out in full (not built from strings), so Tailwind finds the class names.
 */
export const SPORT_BG: Record<Sport, string> = {
  swim: "bg-zone-1",
  bike: "bg-zone-2",
  run: "bg-zone-5",
  strength: "bg-zone-3",
  other: "bg-muted-foreground/40",
};

/** A light tint of the sport color, for chip backgrounds. */
export const SPORT_TINT: Record<Sport, string> = {
  swim: "bg-zone-1/10",
  bike: "bg-zone-2/10",
  run: "bg-zone-5/10",
  strength: "bg-zone-3/15",
  other: "bg-muted",
};

export const SPORT_BORDER: Record<Sport, string> = {
  swim: "border-l-zone-1",
  bike: "border-l-zone-2",
  run: "border-l-zone-5",
  strength: "border-l-zone-3",
  other: "border-l-muted-foreground/50",
};

export const SPORT_TEXT: Record<Sport, string> = {
  swim: "text-zone-1",
  bike: "text-zone-2",
  run: "text-zone-5",
  // The zone-3 yellow is too pale for text on light backgrounds (owner feedback 2026-11-12).
  strength: "text-amber-600 dark:text-zone-3",
  other: "text-muted-foreground",
};

export const SPORT_ICON: Record<Sport, LucideIcon> = {
  swim: Waves,
  bike: Bike,
  run: Footprints,
  strength: Dumbbell,
  other: Activity,
};

/** Sports shown as distance in totals. Strength (and other) are shown as time (HOME-4, HOME-5). */
export const DISTANCE_SPORTS = ["swim", "bike", "run"] as const;
