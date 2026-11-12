import { z } from "zod";
import { LOCALES, UNITS, WEEK_STARTS } from "@/lib/preferences";

/** User settings form (SET-1..3). */
export const settingsSchema = z.object({
  units: z.enum(UNITS),
  weekStart: z.enum(WEEK_STARTS),
  locale: z.enum(LOCALES),
});

export type Settings = z.infer<typeof settingsSchema>;
