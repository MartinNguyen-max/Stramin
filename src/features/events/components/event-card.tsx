"use client";

import { Pencil, Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { toDisplayDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { daysUntil } from "../countdown";
import type { EventType, EventView } from "../types";

/** Default backgrounds in the brand's zone colors, one per type (EVT-2). */
const BACKGROUND: Record<EventType, string> = {
  triathlon: "bg-linear-to-br from-zone-1 via-zone-2 to-zone-5",
  run: "bg-linear-to-br from-zone-3 via-zone-4 to-zone-5",
  bike: "bg-linear-to-br from-zone-3 via-zone-2 to-zone-1",
  swim: "bg-linear-to-br from-zone-2 via-zone-1 to-[#2b5fd9]",
  other: "bg-linear-to-br from-zone-1 via-zone-4 to-zone-5",
};

const CARD =
  "relative h-36 w-64 shrink-0 snap-start overflow-hidden rounded-2xl";

/** One countdown card (HOME-1, EVT-3): image or zone gradient, days left, title and date. */
export function EventCard({
  event,
  today,
  onEdit,
}: {
  event: EventView;
  today: string;
  /** Missing on the demo page, where events can't be changed. */
  onEdit?: () => void;
}) {
  const t = useTranslations("Events");
  const format = useFormatter();
  const days = daysUntil(event.date, today);
  const countdown =
    days === 0
      ? t("today")
      : days === 1
        ? t("tomorrow")
        : t("daysLeft", { count: days });

  return (
    <div className={cn(CARD, "text-white")}>
      {event.imageUrl ? (
        // biome-ignore lint/performance/noImgElement: short-lived signed URLs; next/image's optimizer can't cache them.
        <img
          src={event.imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className={cn("absolute inset-0", BACKGROUND[event.type])} />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-black/10" />
      <div className="relative flex h-full flex-col justify-between p-3.5">
        <span className="text-[11px] font-semibold tracking-wider uppercase opacity-90">
          {t(`types.${event.type}`)}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-3xl leading-none font-bold tabular-nums drop-shadow">
            {countdown}
          </span>
          <span className="truncate font-semibold drop-shadow">
            {event.title}
          </span>
          <span className="text-xs opacity-85">
            {format.dateTime(toDisplayDate(event.date), {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={t("editEvent", { title: event.title })}
          className="group absolute inset-0 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          <span className="absolute top-2.5 right-2.5 rounded-full bg-black/30 p-1.5 opacity-80 transition-opacity group-hover:opacity-100">
            <Pencil className="size-3.5" />
          </span>
        </button>
      )}
    </div>
  );
}

/** The "+ Add event" card at the end of the row (EVT-4). */
export function AddEventCard({
  onClick,
  isEmpty,
}: {
  onClick: () => void;
  isEmpty: boolean;
}) {
  const t = useTranslations("Events");
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        CARD,
        "flex flex-col items-center justify-center gap-1.5 border-2 border-dashed text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground",
        isEmpty && "w-full max-w-sm sm:w-64",
      )}
    >
      <Plus className="size-6" />
      <span className="font-semibold">{t("add")}</span>
      {isEmpty && <span className="text-xs">{t("emptyHint")}</span>}
    </button>
  );
}
