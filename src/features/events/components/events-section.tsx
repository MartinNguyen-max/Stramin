import { getTranslations } from "next-intl/server";
import type { CurrentUser } from "@/features/auth/current-user";
import { addDays, today } from "@/lib/dates";
import { listUpcomingEvents } from "../data";
import type { EventView } from "../types";
import { EventsStrip } from "./events-strip";

/** Loads the user's upcoming events for Home (HOME-1). Shows a note if the events table isn't there yet. */
export async function EventsSection({ user }: { user: CurrentUser }) {
  const serverToday = today();
  let events: EventView[] | null = null;
  try {
    // One day of margin: the browser hides events that are already past in the user's own timezone.
    events = await listUpcomingEvents(user, addDays(serverToday, -1));
  } catch (error) {
    console.error("[events] unavailable", error);
  }

  if (!events) {
    const t = await getTranslations("Events");
    return (
      <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
        {t("unavailable")}
      </p>
    );
  }
  return (
    <EventsStrip events={events} userId={user.id} serverToday={serverToday} />
  );
}
