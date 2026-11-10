"use client";

import { ExternalLink, Pencil } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { stravaActivityUrl } from "@/features/activities/strava-url";
import { localToday } from "@/features/events/countdown";
import type { EffortSport } from "@/lib/analytics/best-efforts";
import { toDisplayDate } from "@/lib/dates";
import { formatClock, formatSportPace } from "@/lib/format";
import type { Units } from "@/lib/preferences";
import { cn } from "@/lib/utils";
import {
  type EffortFormState,
  resetBestEffort,
  saveBestEffort,
} from "../best-effort-actions";

/** What the row shows; plain values, so it can be passed from the server. */
export type EffortRowData = {
  seconds: number;
  date: string | null;
  source: "strava" | "manual";
  activityId?: string;
  /** The Strava estimate behind a manual value. */
  estimateSeconds?: number;
};

const idle: EffortFormState = { status: "idle" };

/** One distance in the best efforts list, editable in place (BE-4, BE-6, BE-7). */
export function BestEffortRow({
  sport,
  distance,
  label,
  effort,
  units,
  editable,
}: {
  sport: EffortSport;
  distance: number;
  label: string;
  effort?: EffortRowData;
  units: Units;
  editable: boolean;
}) {
  const t = useTranslations("Profile.bestEfforts");
  const format = useFormatter();
  const [editing, setEditing] = useState(false);

  const [state, saveAction, saving] = useActionState(
    async (prev: EffortFormState, formData: FormData) => {
      const result = await saveBestEffort(prev, formData);
      if (result.status === "saved") setEditing(false);
      return result;
    },
    idle,
  );
  const [resetState, resetAction, resetting] = useActionState(
    async (prev: EffortFormState, formData: FormData) => {
      const result = await resetBestEffort(prev, formData);
      if (result.status === "saved") setEditing(false);
      return result;
    },
    idle,
  );
  const error =
    state.status === "error"
      ? state.error
      : resetState.status === "error"
        ? resetState.error
        : null;

  const pace = effort
    ? formatSportPace(sport, distance, effort.seconds, units)
    : null;

  return (
    <li className="flex flex-col gap-1 py-2.5">
      <div className="flex items-center gap-3">
        <span className="w-28 shrink-0 text-sm font-medium">{label}</span>
        {effort ? (
          <>
            <span className="font-semibold tabular-nums">
              {formatClock(effort.seconds)}
            </span>
            <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
              {pace}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">{t("none")}</span>
        )}
        {editable && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={t("edit", { distance: label })}
            className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>

      {effort && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-31 text-xs text-muted-foreground">
          {pace && <span className="tabular-nums sm:hidden">{pace}</span>}
          {effort.date && (
            <span>
              {format.dateTime(toDisplayDate(effort.date), {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          {effort.source === "strava" && effort.activityId ? (
            <a
              href={stravaActivityUrl(effort.activityId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-[#FC4C02] hover:underline"
            >
              {t("strava")}
              <ExternalLink className="size-3" />
            </a>
          ) : (
            <span className="rounded-full bg-muted px-1.5 py-0.5 font-medium text-foreground">
              {t("manual")}
            </span>
          )}
          {effort.source === "manual" && effort.estimateSeconds && (
            <span className="tabular-nums">
              {t("stravaValue", { time: formatClock(effort.estimateSeconds) })}
            </span>
          )}
        </div>
      )}

      {editing && (
        <form
          action={saveAction}
          className="mt-1 flex flex-wrap items-end gap-2 rounded-xl bg-muted/50 p-3"
        >
          <input type="hidden" name="sport" value={sport} />
          <input type="hidden" name="distance" value={Math.round(distance)} />
          <div className="flex flex-col gap-1">
            <Label htmlFor={`time-${sport}-${distance}`} className="text-xs">
              {t("timeLabel")}
            </Label>
            <Input
              id={`time-${sport}-${distance}`}
              name="time"
              required
              inputMode="numeric"
              pattern="[0-9:]+"
              defaultValue={effort ? formatClock(effort.seconds) : ""}
              placeholder="19:45"
              className="w-28"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`date-${sport}-${distance}`} className="text-xs">
              {t("dateLabel")}
            </Label>
            <Input
              id={`date-${sport}-${distance}`}
              name="date"
              type="date"
              max={localToday()}
              defaultValue={
                effort?.source === "manual" ? (effort.date ?? "") : ""
              }
              className="w-auto"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving || resetting}>
              {t("save")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              {t("cancel")}
            </Button>
            {effort?.source === "manual" && (
              <Button
                type="submit"
                variant="outline"
                formAction={resetAction}
                disabled={saving || resetting}
              >
                {effort.estimateSeconds ? t("reset") : t("remove")}
              </Button>
            )}
          </div>
          {error && (
            <p role="alert" className={cn("w-full text-sm text-destructive")}>
              {t(`errors.${error}`)}
            </p>
          )}
        </form>
      )}
    </li>
  );
}
