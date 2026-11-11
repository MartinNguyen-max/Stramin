import { z } from "zod";
import { isValidDate } from "@/lib/dates";
import { EVENT_TYPES, MAX_EVENT_TITLE } from "./types";

/** Image paths are "{user_id}/{uuid}.webp" (EVT-2). The user id is checked separately. */
const IMAGE_PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/;

/** The event form (EVT-1, EVT-2). Error messages are translation keys in `Events.errors`. */
export const eventSchema = z.object({
  id: z.uuid().optional(),
  title: z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(1, { error: "titleRequired" })
        .max(MAX_EVENT_TITLE, { error: "titleTooLong" }),
    ),
  date: z.string().refine(isValidDate, { error: "dateInvalid" }),
  type: z.enum(EVENT_TYPES, { error: "generic" }),
  imagePath: z
    .string()
    .refine((value) => value === "" || IMAGE_PATH_RE.test(value), {
      error: "imageInvalid",
    }),
  imageX: z.coerce.number().int().min(0).max(100).catch(50),
  imageY: z.coerce.number().int().min(0).max(100).catch(50),
});

export type EventErrorKey =
  | "titleRequired"
  | "titleTooLong"
  | "dateInvalid"
  | "imageInvalid"
  | "imageUpload"
  | "unavailable"
  | "generic";

export type EventFormState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; error: EventErrorKey };

export function firstEventError(error: z.ZodError): EventErrorKey {
  return (error.issues[0]?.message as EventErrorKey) ?? "generic";
}
