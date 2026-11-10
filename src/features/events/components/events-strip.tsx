"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useLocalToday } from "../countdown";
import type { EventView } from "../types";
import { AddEventCard, EventCard } from "./event-card";
import { EventDialog } from "./event-dialog";

/**
 * The row of event countdowns at the top of Home (HOME-1, EVT-3, EVT-4).
 * Scrolls sideways; the last card adds an event. Past events are hidden (by the browser's own date).
 */
export function EventsStrip({
  events,
  userId,
  serverToday,
}: {
  events: EventView[];
  /** Missing on the demo page: the cards are read-only there. */
  userId?: string;
  serverToday: string;
}) {
  const t = useTranslations("Events");
  const today = useLocalToday(serverToday);
  const [editing, setEditing] = useState<EventView | "new" | null>(null);
  const upcoming = events.filter((event) => event.date >= today);

  return (
    <section aria-label={t("title")}>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {upcoming.map((event) => (
          <li key={event.id}>
            <EventCard
              event={event}
              today={today}
              onEdit={userId ? () => setEditing(event) : undefined}
            />
          </li>
        ))}
        {userId && (
          <li className={upcoming.length === 0 ? "w-full" : undefined}>
            <AddEventCard
              onClick={() => setEditing("new")}
              isEmpty={upcoming.length === 0}
            />
          </li>
        )}
      </ul>
      {userId && editing && (
        <EventDialog
          event={editing === "new" ? null : editing}
          userId={userId}
          today={today}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
