/** Heart-rate zones Z1–Z5 and the effort groups of the training catalog (TRN-2, TRN-5). */
export type Zone = 1 | 2 | 3 | 4 | 5;

/** Zone colors from the logo. Written out in full, so Tailwind finds the class names. */
export const ZONE_BG: Record<Zone, string> = {
  1: "bg-zone-1",
  2: "bg-zone-2",
  3: "bg-zone-3",
  4: "bg-zone-4",
  5: "bg-zone-5",
};

export const ZONE_TEXT: Record<Zone, string> = {
  1: "text-zone-1",
  2: "text-zone-2",
  3: "text-zone-3",
  4: "text-zone-4",
  5: "text-zone-5",
};

/** Effort groups: Z1–Z2 easy, Z3 moderate, Z4–Z5 hard. */
export const EFFORTS = ["easy", "moderate", "hard"] as const;
export type Effort = (typeof EFFORTS)[number];

export const EFFORT_ZONES: Record<Effort, Zone[]> = {
  easy: [1, 2],
  moderate: [3],
  hard: [4, 5],
};

/** The color of an effort group: its highest zone. */
export const EFFORT_BG: Record<Effort, string> = {
  easy: "bg-zone-2",
  moderate: "bg-zone-3",
  hard: "bg-zone-5",
};

export const EFFORT_BORDER: Record<Effort, string> = {
  easy: "border-t-zone-2",
  moderate: "border-t-zone-3",
  hard: "border-t-zone-5",
};
