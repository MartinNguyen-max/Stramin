"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { setFavorite } from "../actions";

/**
 * The star on a workout card (owner feedback 2026-11-15). It sits inside the card's <summary>, so a
 * tap must not open or close the card. Shows the new state at once and goes back if saving fails.
 */
export function FavoriteButton({
  workoutId,
  favorite,
}: {
  workoutId: string;
  favorite: boolean;
}) {
  const t = useTranslations("Training.favorites");
  const [optimistic, setOptimistic] = useOptimistic(favorite);
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();
  const label = failed ? t("error") : t(optimistic ? "remove" : "add");

  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const next = !optimistic;
        setFailed(false);
        startTransition(async () => {
          setOptimistic(next);
          const result = await setFavorite(workoutId, next);
          if (!result.ok) setFailed(true);
        });
      }}
      className={cn(
        "-m-1.5 shrink-0 rounded-full p-1.5 transition-colors hover:bg-muted",
        failed && "text-destructive",
      )}
    >
      <Star
        aria-hidden
        className={cn(
          "size-5",
          optimistic
            ? "fill-amber-400 text-amber-400"
            : "text-muted-foreground",
        )}
      />
    </button>
  );
}
