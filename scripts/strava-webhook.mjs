// Manages Strava's webhook subscription (CON-4, ADR 0012). Strava allows one subscription per app.
//
//   node scripts/strava-webhook.mjs list
//   node scripts/strava-webhook.mjs create [callback-url]
//   node scripts/strava-webhook.mjs delete <subscription-id>
//
// Reads STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET from .env.local. "create" only works once the webhook
// route is deployed: Strava calls it right away to check the verify token.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const API = "https://www.strava.com/api/v3/push_subscriptions";
const clientId = process.env.STRAVA_CLIENT_ID;
const clientSecret = process.env.STRAVA_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error(
    "STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET must be set (.env.local).",
  );
  process.exit(1);
}

/** The same value as webhookVerifyToken() in src/features/strava/webhook.ts. */
const verifyToken = createHash("sha256")
  .update(`stramin-webhook:${clientSecret}`)
  .digest("hex")
  .slice(0, 32);

const [command = "list", argument] = process.argv.slice(2);
const auth = { client_id: clientId, client_secret: clientSecret };

async function show(response) {
  const text = await response.text();
  console.log(response.status, text || "(empty)");
  if (!response.ok) process.exitCode = 1;
}

if (command === "list") {
  await show(await fetch(`${API}?${new URLSearchParams(auth)}`));
} else if (command === "create") {
  const callbackUrl =
    argument ?? "https://stramin.vercel.app/api/strava/webhook";
  await show(
    await fetch(API, {
      method: "POST",
      body: new URLSearchParams({
        ...auth,
        callback_url: callbackUrl,
        verify_token: verifyToken,
      }),
    }),
  );
} else if (command === "delete" && argument) {
  await show(
    await fetch(`${API}/${argument}?${new URLSearchParams(auth)}`, {
      method: "DELETE",
    }),
  );
} else {
  console.error(
    "Usage: node scripts/strava-webhook.mjs list | create [url] | delete <id>",
  );
  process.exit(1);
}
