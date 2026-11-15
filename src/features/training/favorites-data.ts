import { and, desc, eq } from "drizzle-orm";
import type { CurrentUser } from "@/features/auth/current-user";
import { withRls } from "@/lib/db/rls";
import { favoriteWorkouts } from "@/lib/db/schema";

/** The user's favorite workout ids, newest first. Runs as the user (RLS). */
export async function listFavoriteIds(user: CurrentUser): Promise<string[]> {
  const rows = await withRls(user.claims, (tx) =>
    tx
      .select({ workoutId: favoriteWorkouts.workoutId })
      .from(favoriteWorkouts)
      .where(eq(favoriteWorkouts.userId, user.id))
      .orderBy(desc(favoriteWorkouts.createdAt)),
  );
  return rows.map((row) => row.workoutId);
}

/** Adds or removes one favorite. Adding twice is fine. */
export async function setFavoriteRow(
  user: CurrentUser,
  workoutId: string,
  favorite: boolean,
): Promise<void> {
  await withRls(user.claims, (tx) =>
    favorite
      ? tx
          .insert(favoriteWorkouts)
          .values({ userId: user.id, workoutId })
          .onConflictDoNothing()
      : tx
          .delete(favoriteWorkouts)
          .where(
            and(
              eq(favoriteWorkouts.userId, user.id),
              eq(favoriteWorkouts.workoutId, workoutId),
            ),
          ),
  );
}
