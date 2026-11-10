"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { CALENDAR_VIEWS, type CalendarView } from "@/lib/analytics/calendar";
import { cn } from "@/lib/utils";
import { CalendarLink, useCalendarNavigate } from "./calendar-shell";

const arrowClass = cn(
  buttonVariants({ variant: "outline", size: "icon" }),
  "size-8",
);

/** The period bar above the calendar (HOME-6): ‹ › Today, the label and the period type buttons. */
export function CalendarToolbar({
  view,
  label,
  prev,
  next,
  today,
  from,
  to,
}: {
  view: CalendarView;
  label: string;
  /** Queries for the neighbouring periods; missing when the view can't move that way. */
  prev?: Record<string, string>;
  next?: Record<string, string>;
  /** Query for the current period; missing when today is already shown. */
  today?: Record<string, string>;
  /** The shown period, used as the default for "Custom". */
  from: string;
  to: string;
}) {
  const t = useTranslations("Calendar");
  const navigate = useCalendarNavigate();
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          {prev ? (
            <CalendarLink
              query={prev}
              aria-label={t("previous")}
              className={arrowClass}
            >
              <ChevronLeft />
            </CalendarLink>
          ) : (
            <span
              aria-hidden
              className={cn(arrowClass, "pointer-events-none opacity-30")}
            >
              <ChevronLeft />
            </span>
          )}
          {next ? (
            <CalendarLink
              query={next}
              aria-label={t("next")}
              className={arrowClass}
            >
              <ChevronRight />
            </CalendarLink>
          ) : (
            <span
              aria-hidden
              className={cn(arrowClass, "pointer-events-none opacity-30")}
            >
              <ChevronRight />
            </span>
          )}
          <h2 className="ml-1.5 truncate text-lg font-semibold tracking-tight first-letter:uppercase">
            {label}
          </h2>
          {today && (
            <CalendarLink
              query={today}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground",
              )}
            >
              {t("today")}
            </CalendarLink>
          )}
        </div>

        <fieldset className="flex rounded-full border p-0.5 text-xs">
          <legend className="sr-only">{t("periodType")}</legend>
          {CALENDAR_VIEWS.map((option) => {
            const active =
              option === "custom"
                ? view === "custom" || customOpen
                : option === view;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  if (option === "custom") {
                    setCustomOpen((open) => !open);
                    return;
                  }
                  setCustomOpen(false);
                  navigate({ view: option }, { view: option });
                }}
                className={cn(
                  "rounded-full px-2.5 py-1 font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`views.${option}`)}
              </button>
            );
          })}
        </fieldset>
      </div>

      {customOpen && (
        <form
          className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!customFrom || !customTo || customFrom > customTo) return;
            const request = {
              view: "custom" as const,
              from: customFrom,
              to: customTo,
            };
            setCustomOpen(false);
            navigate(request, request);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="calendar-from">{t("from")}</Label>
            <Input
              id="calendar-from"
              type="date"
              required
              value={customFrom}
              max={customTo}
              onChange={(event) => setCustomFrom(event.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="calendar-to">{t("to")}</Label>
            <Input
              id="calendar-to"
              type="date"
              required
              value={customTo}
              min={customFrom}
              onChange={(event) => setCustomTo(event.target.value)}
              className="w-auto"
            />
          </div>
          <Button type="submit" size="lg">
            {t("show")}
          </Button>
        </form>
      )}
    </div>
  );
}
