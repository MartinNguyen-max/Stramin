/** User preference options (SET-1..3). Kept free of database imports, so client components can use them. */
export const UNITS = ["metric", "imperial"] as const;
export const WEEK_STARTS = ["monday", "sunday"] as const;
export const LOCALES = ["en", "da"] as const;

export type Units = (typeof UNITS)[number];
export type WeekStart = (typeof WEEK_STARTS)[number];
