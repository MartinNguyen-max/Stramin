import { and, asc, eq, gte } from "drizzle-orm";
import type { CurrentUser } from "@/features/auth/current-user";
import { withRls } from "@/lib/db/rls";
import { type EventRow, events } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { EVENT_IMAGE_BUCKET, type EventView } from "./types";

/** How long an image link stays valid. The page is rendered per request, so an hour is plenty. */
const SIGNED_URL_SECONDS = 60 * 60;

/** Upcoming events (from `fromDate`, inclusive), soonest first, with signed image URLs (EVT-3). Runs as the user (RLS). */
export async function listUpcomingEvents(
  user: CurrentUser,
  fromDate: string,
): Promise<EventView[]> {
  const where = and(
    eq(events.userId, user.id),
    gte(events.eventDate, fromDate),
  );
  let rows: ListedRow[];
  try {
    rows = await withRls(user.claims, (tx) =>
      tx
        .select()
        .from(events)
        .where(where)
        .orderBy(asc(events.eventDate), asc(events.createdAt)),
    );
  } catch (error) {
    // Without the image position columns (database not updated yet), still list the events.
    console.error("[events] full list unavailable, using basics", error);
    rows = await withRls(user.claims, (tx) =>
      tx
        .select({
          id: events.id,
          title: events.title,
          eventDate: events.eventDate,
          type: events.type,
          imagePath: events.imagePath,
        })
        .from(events)
        .where(where)
        .orderBy(asc(events.eventDate), asc(events.createdAt)),
    );
  }
  const urls = await signedImageUrls(
    rows.flatMap((row) => (row.imagePath ? [row.imagePath] : [])),
  );
  return rows.map((row) => toView(row, urls));
}

type ListedRow = Pick<
  EventRow,
  "id" | "title" | "eventDate" | "type" | "imagePath"
> &
  Partial<Pick<EventRow, "imageX" | "imageY">>;

function toView(row: ListedRow, urls: Map<string, string>): EventView {
  return {
    id: row.id,
    title: row.title,
    date: row.eventDate,
    type: row.type,
    imagePath: row.imagePath,
    imageUrl: row.imagePath ? (urls.get(row.imagePath) ?? null) : null,
    imageX: row.imageX ?? 50,
    imageY: row.imageY ?? 50,
  };
}

async function signedImageUrls(paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  try {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from(EVENT_IMAGE_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_SECONDS);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
    }
  } catch (error) {
    // Without images the cards fall back to the default background.
    console.warn("[events] could not sign image URLs", error);
  }
  return urls;
}

export async function getEvent(
  user: CurrentUser,
  id: string,
): Promise<EventRow | undefined> {
  const [row] = await withRls(user.claims, (tx) =>
    tx
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, user.id))),
  );
  return row;
}

type EventInput = {
  title: string;
  date: string;
  type: EventRow["type"];
  imagePath: string | null;
  imageX: number;
  imageY: number;
};

export async function insertEvent(
  user: CurrentUser,
  input: EventInput,
): Promise<void> {
  await withRls(user.claims, (tx) =>
    tx.insert(events).values({
      userId: user.id,
      title: input.title,
      eventDate: input.date,
      type: input.type,
      imagePath: input.imagePath,
      imageX: input.imageX,
      imageY: input.imageY,
    }),
  );
}

export async function updateEvent(
  user: CurrentUser,
  id: string,
  input: EventInput,
): Promise<void> {
  await withRls(user.claims, (tx) =>
    tx
      .update(events)
      .set({
        title: input.title,
        eventDate: input.date,
        type: input.type,
        imagePath: input.imagePath,
        imageX: input.imageX,
        imageY: input.imageY,
      })
      .where(and(eq(events.id, id), eq(events.userId, user.id))),
  );
}

export async function deleteEventRow(
  user: CurrentUser,
  id: string,
): Promise<void> {
  await withRls(user.claims, (tx) =>
    tx.delete(events).where(and(eq(events.id, id), eq(events.userId, user.id))),
  );
}

/** Deletes an image from storage. Failing is harmless (the file is just left behind). */
export async function removeEventImage(path: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.storage.from(EVENT_IMAGE_BUCKET).remove([path]);
  } catch (error) {
    console.warn("[events] could not delete image", error);
  }
}
