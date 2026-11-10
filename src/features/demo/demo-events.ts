import type { EventView } from "@/features/events/types";
import { addDays } from "@/lib/dates";

/** Example events for the demo page, always in the future. */
export function demoEvents(today: string): EventView[] {
  return [
    {
      id: "demo-event-1",
      title: "Copenhagen Half Marathon",
      date: addDays(today, 41),
      type: "run",
      imagePath: null,
      imageUrl: null,
    },
    {
      id: "demo-event-2",
      title: "Ironman Copenhagen",
      date: addDays(today, 279),
      type: "triathlon",
      imagePath: null,
      imageUrl: null,
    },
    {
      id: "demo-event-3",
      title: "Open water 3.8 km",
      date: addDays(today, 305),
      type: "swim",
      imagePath: null,
      imageUrl: null,
    },
  ];
}
