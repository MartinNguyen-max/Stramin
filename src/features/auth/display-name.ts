import { nameSchema } from "./schemas";

/**
 * What we call the user (ACC-5), read from Supabase's `user_metadata`:
 * 1. the name they chose (`display_name`, set at sign up or in Settings),
 * 2. otherwise the first name from their Google account (`full_name` / `name`).
 * Every candidate passes the same validation as the form, so nothing unexpected is shown.
 */
export function displayName(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const { display_name, full_name, name } = metadata as Record<string, unknown>;

  for (const candidate of [
    display_name,
    firstWord(full_name),
    firstWord(name),
  ]) {
    const parsed = nameSchema.safeParse(candidate);
    if (parsed.success) return parsed.data;
  }
  return undefined;
}

function firstWord(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim().split(/\s+/)[0] : undefined;
}
