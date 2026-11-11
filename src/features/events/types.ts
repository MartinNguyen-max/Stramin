/** Event types (EVT-1). Kept free of database imports, so client components can use them. */
export const EVENT_TYPES = [
  "triathlon",
  "run",
  "bike",
  "swim",
  "other",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Max length of an event title (EVT-1). */
export const MAX_EVENT_TITLE = 60;

/** Storage bucket for event background images (EVT-2). Private; paths are "{user_id}/{uuid}.webp". */
export const EVENT_IMAGE_BUCKET = "event-images";

/** An event as the UI needs it. */
export type EventView = {
  id: string;
  title: string;
  /** "YYYY-MM-DD" */
  date: string;
  type: EventType;
  /** Storage path, or null for the default background. */
  imagePath: string | null;
  /** Short-lived signed URL of the image. */
  imageUrl: string | null;
  /** The part of the image that shows, in % (CSS object-position). */
  imageX: number;
  imageY: number;
};
