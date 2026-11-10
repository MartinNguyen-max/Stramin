"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/features/auth/current-user";
import {
  deleteEventRow,
  getEvent,
  insertEvent,
  removeEventImage,
  updateEvent,
} from "./data";
import { type EventFormState, eventSchema, firstEventError } from "./schemas";

/** Creates or updates an event (EVT-1, EVT-2). The image was already uploaded by the browser. */
export async function saveEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const user = await getCurrentUser();
  const parsed = eventSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title") ?? "",
    date: formData.get("date") ?? "",
    type: formData.get("type") ?? "",
    imagePath: formData.get("imagePath") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", error: firstEventError(parsed.error) };
  }
  const { id, imagePath, ...fields } = parsed.data;
  // Only images in the user's own folder (storage RLS enforces this too).
  if (imagePath && !imagePath.startsWith(`${user.id}/`)) {
    return { status: "error", error: "imageInvalid" };
  }

  try {
    const input = { ...fields, imagePath: imagePath || null };
    if (id) {
      const existing = await getEvent(user, id);
      if (!existing) return { status: "error", error: "generic" };
      await updateEvent(user, id, input);
      if (existing.imagePath && existing.imagePath !== input.imagePath) {
        await removeEventImage(existing.imagePath);
      }
    } else {
      await insertEvent(user, input);
    }
  } catch (error) {
    console.error("[events] save failed", error);
    return { status: "error", error: "unavailable" };
  }

  refresh();
  return { status: "saved" };
}

/** Deletes an event and its image (EVT-1). */
export async function deleteEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const user = await getCurrentUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { status: "error", error: "generic" };
  }
  try {
    const existing = await getEvent(user, id);
    if (!existing) return { status: "error", error: "generic" };
    await deleteEventRow(user, id);
    if (existing.imagePath) await removeEventImage(existing.imagePath);
  } catch (error) {
    console.error("[events] delete failed", error);
    return { status: "error", error: "unavailable" };
  }
  refresh();
  return { status: "saved" };
}
