import { createBrowserSupabase } from "@/lib/supabase/client";
import { ACCEPTED_IMAGE_TYPES, EVENT_IMAGE_BUCKET } from "./types";

/** Longest side of an uploaded event image, in pixels. Enough for a card, small to store. */
const MAX_SIZE = 1600;
/** The original may be big (phone photos); it's resized before upload. */
const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;

/**
 * Resizes the image in the browser and uploads it as WebP to the user's folder (EVT-2).
 * Returns the storage path, e.g. "{user_id}/{uuid}.webp". Throws on failure.
 */
export async function uploadEventImage(
  file: File,
  userId: string,
): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.split(",").includes(file.type)) {
    throw new Error("Unsupported image type");
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error("Image too large");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIZE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas not available");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85),
  );
  if (!blob) throw new Error("Could not encode the image");

  const path = `${userId}/${crypto.randomUUID()}.webp`;
  const { error } = await createBrowserSupabase()
    .storage.from(EVENT_IMAGE_BUCKET)
    .upload(path, blob, { contentType: "image/webp", upsert: false });
  if (error) throw error;
  return path;
}
