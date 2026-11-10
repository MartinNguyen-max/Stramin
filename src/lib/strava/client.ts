/**
 * Strava API client. All calls happen on the server (the client secret and tokens never reach the browser).
 * Rate limits (NFR-4): every response's usage headers are recorded in a RateTracker.
 */

const AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const TOKEN_URL = "https://www.strava.com/oauth/token";
const DEAUTHORIZE_URL = "https://www.strava.com/oauth/deauthorize";
const API_BASE = "https://www.strava.com/api/v3";

export const STRAVA_STATE_COOKIE = "strava_state";

/** Stramin needs this scope to read all activities, including private ("Only you") ones. */
export const REQUIRED_SCOPE = "activity:read_all";

const PAGE_SIZE = 200;
/** Pages fetched at the same time when reading many activities. */
const PARALLEL_PAGES = 3;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. See .env.example.`);
  }
  return value;
}

export class StravaError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "StravaError";
  }
}

export function buildAuthorizeUrl(redirectUri: string, state: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: requireEnv("STRAVA_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: `read,${REQUIRED_SCOPE}`,
    state,
  }).toString();
  return url.toString();
}

export type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  /** Unix time in seconds. */
  expires_at: number;
  athlete?: { id: number; firstname?: string; lastname?: string };
};

async function tokenRequest(
  params: Record<string, string>,
): Promise<StravaTokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("STRAVA_CLIENT_ID"),
      client_secret: requireEnv("STRAVA_CLIENT_SECRET"),
      ...params,
    }),
  });
  if (!response.ok) {
    throw new StravaError(
      `Strava token request failed: ${response.status} ${await response.text()}`,
      response.status,
    );
  }
  return response.json();
}

export function exchangeCode(code: string): Promise<StravaTokenResponse> {
  return tokenRequest({ code, grant_type: "authorization_code" });
}

/** Access tokens last 6 hours; the refresh token gives a new one (and may itself change). */
export function refreshAccessToken(
  refreshToken: string,
): Promise<StravaTokenResponse> {
  return tokenRequest({
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
}

/** Revokes Stramin's access on Strava's side (CON-2). Failing is not fatal: we delete our data anyway. */
export async function deauthorize(accessToken: string): Promise<void> {
  const response = await fetch(DEAUTHORIZE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ access_token: accessToken }),
  });
  if (!response.ok && response.status !== 401) {
    throw new StravaError(
      `Strava deauthorize failed: ${response.status}`,
      response.status,
    );
  }
}

/** Strava's rate-limit usage: a 15-minute window and a daily window. */
export type RateUsage = {
  shortUsed: number;
  shortLimit: number;
  dailyUsed: number;
  dailyLimit: number;
};

/** Reads the usage headers; the read limit ("X-ReadRateLimit-*") is the tighter one when present. */
export function parseRateLimit(headers: Headers): RateUsage | null {
  const prefix = headers.get("x-readratelimit-limit")
    ? "x-readratelimit"
    : "x-ratelimit";
  const limit = headers.get(`${prefix}-limit`)?.split(",").map(Number);
  const usage = headers.get(`${prefix}-usage`)?.split(",").map(Number);
  if (!limit || !usage || limit.length < 2 || usage.length < 2) return null;
  if ([...limit, ...usage].some((n) => Number.isNaN(n))) return null;
  return {
    shortUsed: usage[0],
    shortLimit: limit[0],
    dailyUsed: usage[1],
    dailyLimit: limit[1],
  };
}

/** Collects the latest usage over many calls, so a job can stop before hitting the limit. */
export class RateTracker {
  usage: RateUsage | null = null;
  requests = 0;

  record(headers: Headers) {
    this.requests += 1;
    this.usage = parseRateLimit(headers) ?? this.usage;
  }

  /** True when 80 % of either window is used (NFR-4, ADR 0012). */
  nearLimit(share = 0.8): boolean {
    const u = this.usage;
    if (!u) return false;
    return (
      u.shortUsed >= u.shortLimit * share || u.dailyUsed >= u.dailyLimit * share
    );
  }
}

async function apiGet(
  path: string,
  accessToken: string,
  tracker?: RateTracker,
): Promise<Response> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  tracker?.record(response.headers);
  return response;
}

/** The fields we use from Strava's "SummaryActivity". */
export type StravaActivity = {
  id: number;
  name: string;
  sport_type: string;
  /** UTC start time. */
  start_date: string;
  /** The athlete's local start time, written with a "Z" although it isn't UTC. */
  start_date_local: string;
  moving_time: number;
  elapsed_time: number;
  distance: number;
  total_elevation_gain?: number;
  trainer: boolean;
};

async function fetchPage(
  accessToken: string,
  page: number,
  { after, before }: { after?: number; before?: number },
  tracker?: RateTracker,
): Promise<StravaActivity[]> {
  const query = new URLSearchParams({
    per_page: String(PAGE_SIZE),
    page: String(page),
  });
  if (after !== undefined) query.set("after", String(Math.floor(after)));
  if (before !== undefined) query.set("before", String(Math.floor(before)));
  const response = await apiGet(
    `/athlete/activities?${query}`,
    accessToken,
    tracker,
  );
  if (!response.ok) {
    throw new StravaError(
      `Strava activities page ${page} failed: ${response.status}`,
      response.status,
    );
  }
  return response.json();
}

/**
 * Fetches the athlete's activities, newest first. `after` / `before` are Unix timestamps (seconds) on the
 * UTC start time; without them, the full history. Pages are fetched three at a time.
 * `onBatch` is called after each round with everything fetched so far (to store it and show import progress).
 */
export async function fetchActivities(
  accessToken: string,
  range: { after?: number; before?: number } = {},
  {
    tracker,
    onBatch,
  }: {
    tracker?: RateTracker;
    onBatch?: (soFar: StravaActivity[]) => Promise<void> | void;
  } = {},
): Promise<StravaActivity[]> {
  const all: StravaActivity[] = [];
  for (let first = 1; ; first += PARALLEL_PAGES) {
    const pages = await Promise.all(
      Array.from({ length: PARALLEL_PAGES }, (_, i) =>
        fetchPage(accessToken, first + i, range, tracker),
      ),
    );
    for (const page of pages) all.push(...page);
    await onBatch?.(all);
    if (pages.some((page) => page.length < PAGE_SIZE)) return all;
  }
}

/** One activity, or null when it doesn't exist (anymore) or isn't visible to Stramin. */
export async function fetchActivity(
  accessToken: string,
  id: string,
  tracker?: RateTracker,
): Promise<StravaActivity | null> {
  const response = await apiGet(`/activities/${id}`, accessToken, tracker);
  if (response.status === 404 || response.status === 403) return null;
  if (!response.ok) {
    throw new StravaError(
      `Strava activity ${id} failed: ${response.status}`,
      response.status,
    );
  }
  return response.json();
}
