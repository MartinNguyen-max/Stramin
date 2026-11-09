import { createHash, randomBytes } from "node:crypto";

/**
 * Garmin OAuth2 with PKCE. All token calls happen on the server (the client secret never reaches the browser).
 * SPIKE: minimal helpers for the Garmin connection test. Hardened in the real Garmin integration.
 */

const AUTHORIZE_URL = "https://connect.garmin.com/oauth2Confirm";
const TOKEN_URL = "https://diauth.garmin.com/di-oauth2-service/oauth/token";
const API_BASE = "https://apis.garmin.com/partner-gateway/rest";

export const PKCE_COOKIE = "garmin_pkce";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. See .env.example.`);
  }
  return value;
}

export function garminConfig() {
  return {
    clientId: requireEnv("GARMIN_CLIENT_ID"),
    clientSecret: requireEnv("GARMIN_CLIENT_SECRET"),
    redirectUri: requireEnv("GARMIN_REDIRECT_URI"),
  };
}

/** Random, URL-safe string (43+ chars as PKCE requires). */
function randomUrlSafe(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function createPkce() {
  const verifier = randomUrlSafe(48);
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomUrlSafe(16);
  return { verifier, challenge, state };
}

export function buildAuthorizeUrl(challenge: string, state: string): string {
  const { clientId, redirectUri } = garminConfig();
  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    code_challenge: challenge,
    code_challenge_method: "S256",
    redirect_uri: redirectUri,
    state,
  }).toString();
  return url.toString();
}

export type GarminTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_token_expires_in: number;
};

export async function exchangeCode(
  code: string,
  verifier: string,
): Promise<GarminTokens> {
  const { clientId, clientSecret, redirectUri } = garminConfig();
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Garmin token exchange failed: ${response.status} ${await response.text()}`,
    );
  }
  return response.json();
}

async function garminGet<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Garmin GET ${path} failed: ${response.status}`);
  }
  return response.json();
}

export function fetchUserId(accessToken: string) {
  return garminGet<{ userId: string }>("/user/id", accessToken);
}

export function fetchPermissions(accessToken: string) {
  return garminGet<{ permissions: string[] }>("/user/permissions", accessToken);
}
