import { eq } from "drizzle-orm";
import type { CurrentUser } from "@/features/auth/current-user";
import { withRls } from "@/lib/db/rls";
import { type Profile, profiles } from "@/lib/db/schema";
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

export async function saveSettings(
  user: CurrentUser,
  settings: Settings,
): Promise<void> {
  await withRls(user.claims, (tx) =>
    tx
      .insert(profiles)
      .values({ userId: user.id, ...settings })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { ...settings, updatedAt: new Date() },
      }),
  );
}
