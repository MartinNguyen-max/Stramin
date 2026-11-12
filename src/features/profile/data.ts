import { eq } from "drizzle-orm";
import type { CurrentUser } from "@/features/auth/current-user";
import { withRls } from "@/lib/db/rls";
import { type Profile, profiles } from "@/lib/db/schema";
import type { Units, WeekStart } from "@/lib/preferences";
import type { Settings } from "./schemas";

/**
 * The user's profile. Created with defaults on first use, so no database trigger on `auth.users` is needed.
 * Runs as the user (RLS), so it can only ever touch their own row.
 */
export async function getOrCreateProfile(
  user: CurrentUser,
  locale: Settings["locale"],
): Promise<Profile> {
  return withRls(user.claims, async (tx) => {
    const [existing] = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id));
    if (existing) return existing;

    await tx
      .insert(profiles)
      .values({ userId: user.id, locale })
      .onConflictDoNothing();
    const [created] = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id));
    return created;
  });
}

/** Saves one or more settings at once; the profile exists (Settings creates it). Runs as the user (RLS). */
export async function updatePreferences(
  user: CurrentUser,
  patch: Partial<Settings>,
): Promise<void> {
  await withRls(user.claims, (tx) =>
    tx
      .update(profiles)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(profiles.userId, user.id)),
  );
}

/**
 * Units and week start for a page, with defaults when the database can't be read, so a page still
 * renders. Pages start it alongside their other reads (`Promise.all`) instead of before them.
 */
export async function getPreferences(
  user: CurrentUser,
  locale: Settings["locale"],
): Promise<{ units: Units; weekStart: WeekStart }> {
  try {
    const profile = await getOrCreateProfile(user, locale);
    return { units: profile.units, weekStart: profile.weekStart };
  } catch (error) {
    console.error("[profile] profile unavailable, using defaults", error);
    return { units: "metric", weekStart: "monday" };
  }
}
