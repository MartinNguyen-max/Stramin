"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import type { CalendarView } from "@/lib/analytics/calendar";
import { cn } from "@/lib/utils";
import { saveThisWeekChoice } from "../preference";

/**
 * The "This week" card folds open and closed (owner feedback 2026-11-15). The header stays visible;
 * the choice is remembered per period type. Without `view` (the landing page) nothing is saved.
 */
export function ThisWeekToggle({
  view,
  defaultOpen,
  summary,
  corner,
  children,
}: {
  view?: CalendarView;
  defaultOpen: boolean;
  summary: ReactNode;
  /** Shown in the top-right corner, outside the clickable header (the info button). */
  corner?: ReactNode;
  children: ReactNode;
}) {
  const card = (
    <details
      open={defaultOpen}
      onToggle={(event) => {
        if (view) saveThisWeekChoice(view, event.currentTarget.open);
      }}
      className="group rounded-2xl border bg-card"
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden",
          corner && "pr-12",
        )}
      >
        <span className="min-w-0 flex-1">{summary}</span>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4">{children}</div>
    </details>
  );
  if (!corner) return card;
  // The corner sits beside the header, not inside it, so tapping it doesn't fold the card.
  return (
    <div className="relative">
      {card}
      <div className="absolute top-[1.125rem] right-3">{corner}</div>
    </div>
  );
}
