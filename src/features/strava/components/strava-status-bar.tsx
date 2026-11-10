"use client";

import { RefreshCw } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import type { StravaStatus } from "@/features/activities/data";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { refreshStrava, type StravaActionState } from "../actions";

/** While importing, the page reloads its data this often to show progress (CON-3). */
const POLL_MS = 4000;

/**
 * Above the calendar: import progress (CON-3), or "Synced 5 minutes ago" with a Refresh button (CON-5).
 */
export function StravaStatusBar({
  status,
}: {
  status: Extract<StravaStatus, { connected: true }>;
}) {
  const t = useTranslations("Strava");
  const format = useFormatter();
  const router = useRouter();
  const now = useNow({ updateInterval: 60_000 });
  const [state, action, pending] = useActionState<StravaActionState>(
    refreshStrava,
    { status: "idle" },
  );
  const importing =
    status.importState === "pending" || status.importState === "running";

  useEffect(() => {
    if (!importing) return;
    const timer = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [importing, router]);

  if (importing) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-sm">
        <ZoneSpinner size={28} label={t("importing")} hideLabel />
        <span>
          <span className="font-medium">{t("importing")}</span>{" "}
          <span className="text-muted-foreground tabular-nums">
            {t("importedSoFar", { count: status.importedCount })}
          </span>
        </span>
      </div>
    );
  }

  const lastSync = status.lastSyncAt ? new Date(status.lastSyncAt) : null;
  const message =
    state.status === "error"
      ? t(`errors.${state.error}`)
      : status.importState === "failed"
        ? t("importFailed")
        : lastSync
          ? t("synced", { time: format.relativeTime(lastSync, now) })
          : null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
      {message && (
        <span
          role={state.status === "error" ? "alert" : undefined}
          className={cn(state.status === "error" && "text-destructive")}
        >
          {message}
        </span>
      )}
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-medium text-foreground hover:bg-muted disabled:opacity-60"
        >
          {pending ? (
            <ZoneSpinner size={14} label={t("refreshing")} hideLabel />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          {pending ? t("refreshing") : t("refresh")}
        </button>
      </form>
    </div>
  );
}
