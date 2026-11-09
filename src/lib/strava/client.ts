/**
 * Strava API client. All calls happen on the server (the client secret never reaches the browser).
 * SPIKE: minimal version for the Strava data test. Hardened in M3/M4 (token storage, refresh, rate limits).
 */

const AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const TOKEN_URL = "https://www.strava.com/oauth/token";
const API_BASE = "https://www.strava.com/api/v3";

export const STRAVA_STATE_COOKIE = "strava_state";
export const STRAVA_TOKEN_COOKIE = "strava_token";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. See .env.example.`);
  }
  return value;
}

export function buildAuthorizeUrl(redirectUri: string, state: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: requireEnv("STRAVA_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    // activity:read_all includes the athlete's own private ("Only you") activities.
    scope: "read,activity:read_all",
    state,
  }).toString();
  return url.toString();
}

export type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export async function exchangeCode(code: string): Promise<StravaTokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("STRAVA_CLIENT_ID"),
      client_secret: requireEnv("STRAVA_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Strava token exchange failed: ${response.status} ${await response.text()}`,
    );
  }
  return response.json();
}

/** The fields we use from Strava's "SummaryActivity". */
export type StravaActivity = {
  id: number;
  name: string;
  sport_type: string;
  start_date_local: string;
  moving_time: number;
  elapsed_time: number;
  distance: number;
  trainer: boolean;
};

/** Fetches the athlete's full activity history, 200 per page (Strava's maximum). */
export async function fetchAllActivities(
  accessToken: string,
): Promise<StravaActivity[]> {
  const all: StravaActivity[] = [];
  for (let page = 1; ; page++) {
    const response = await fetch(
      `${API_BASE}/athlete/activities?per_page=200&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) {
      throw new Error(
        `Strava activities page ${page} failed: ${response.status}`,
      );
    }
    const batch = (await response.json()) as StravaActivity[];
    all.push(...batch);
    if (batch.length < 200) {
      return all;
    }
  }
}
