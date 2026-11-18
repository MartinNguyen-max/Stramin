import { createHash } from "node:crypto";

/**
 * The token Strava echoes when the webhook subscription is created (CON-4). Derived from the client secret,
 * so there's no extra secret to manage (ADR 0012). `scripts/strava-webhook.mjs` computes the same value.
 */
export function webhookVerifyToken(): string {
  const secret = process.env.STRAVA_CLIENT_SECRET;
  if (!secret) throw new Error("STRAVA_CLIENT_SECRET is not set.");
  return createHash("sha256")
    .update(`stramin-webhook:${secret}`)
    .digest("hex")
    .slice(0, 32);
}

/** A webhook event from Strava. */
export type StravaWebhookEvent = {
  object_type: "activity" | "athlete";
  /** A number today; a text value is also accepted, so a switch to 64-bit ids as strings won't drop events. */
  object_id: number | string;
  aspect_type: "create" | "update" | "delete";
  owner_id: number | string;
  subscription_id: number;
  event_time: number;
  updates?: Record<string, string>;
};

function isId(value: unknown): value is number | string {
  return typeof value === "number" || typeof value === "string";
}

export function isWebhookEvent(value: unknown): value is StravaWebhookEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  return (
    (event.object_type === "activity" || event.object_type === "athlete") &&
    isId(event.object_id) &&
    isId(event.owner_id) &&
    (event.aspect_type === "create" ||
      event.aspect_type === "update" ||
      event.aspect_type === "delete")
  );
}
