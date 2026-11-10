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
/** "Synced 5 minutes ago" counts on this often (owner feedback 2026-11-11, S1). */
const TICK_MS = 30_000;
/**
 * Otherwise the page reloads its data this often while it's visible, and whenever it becomes visible
 * again, so workouts the webhook brought in and the newest sync time show up without reloading (S1).
 */
const LIVE_MS = 5 * 60_000;

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
  const now = useNow({ updateInterval: TICK_MS });
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

  useEffect(() => {
    if (importing) return;
    const reloadIfVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(reloadIfVisible, LIVE_MS);
    document.addEventListener("visibilitychange", reloadIfVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", reloadIfVisible);
    };
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
  // Right after a reload the clock may lag the newest sync a little: never say "in 10 seconds".
  const reference = lastSync && lastSync > now ? lastSync : now;
  const message =
    state.status === "error"
      ? t(`errors.${state.error}`)
      : status.importState === "failed"
        ? t("importFailed")
        : lastSync
          ? t("synced", { time: format.relativeTime(lastSync, reference) })
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
