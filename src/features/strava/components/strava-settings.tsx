"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { Button } from "@/components/ui/button";
import type { StravaStatus } from "@/features/activities/data";
import {
  disconnectStrava,
  refreshStrava,
  type StravaActionState,
} from "../actions";

const idle: StravaActionState = { status: "idle" };

/** Settings → Connections → Strava, when connected: who, last sync, Refresh and Disconnect (SET-5, CON-2, CON-5). */
export function StravaSettings({
  status,
}: {
  status: Extract<StravaStatus, { connected: true }>;
}) {
  const t = useTranslations("Strava");
  const format = useFormatter();
  const [confirm, setConfirm] = useState(false);
  const [refreshState, refreshAction, refreshing] = useActionState(
    refreshStrava,
    idle,
  );
  const [disconnectState, disconnectAction, disconnecting] = useActionState(
    disconnectStrava,
    idle,
  );
  const error =
    refreshState.status === "error"
      ? refreshState.error
      : disconnectState.status === "error"
        ? disconnectState.error
        : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-zone-2" />
          {status.athleteName
            ? t("connectedAs", { name: status.athleteName })
            : t("connected")}
        </span>
        <span className="text-xs text-muted-foreground">
          {status.importState === "done" && status.lastSyncAt
            ? t("lastSync", {
                time: format.dateTime(new Date(status.lastSyncAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              })
            : t("importedSoFar", { count: status.importedCount })}
        </span>
      </div>

      {refreshing || disconnecting ? (
        <ZoneSpinner
          size={32}
          label={refreshing ? t("refreshing") : t("disconnecting")}
          className="self-start"
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          <form action={refreshAction}>
            <Button type="submit" variant="outline" size="sm">
              {t("refresh")}
            </Button>
          </form>
          <form action={disconnectAction}>
            <Button
              type={confirm ? "submit" : "button"}
              variant="destructive"
              size="sm"
              onClick={confirm ? undefined : () => setConfirm(true)}
            >
              {confirm ? t("confirmDisconnect") : t("disconnect")}
            </Button>
          </form>
        </div>
      )}
      {confirm && !disconnecting && (
        <p className="text-xs text-muted-foreground">{t("disconnectHint")}</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${error}`)}
        </p>
      )}
    </div>
  );
}
