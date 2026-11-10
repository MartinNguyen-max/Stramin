import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Encrypts OAuth tokens before they're stored (PRIV-4): AES-256-GCM with the key in STRAVA_TOKEN_KEY
 * (32 random bytes, base64). Stored as "v1.<iv>.<tag>.<ciphertext>" (base64url), so the format can change later.
 */

const VERSION = "v1";

function keyFromEnv(): Buffer {
  const raw = process.env.STRAVA_TOKEN_KEY;
  if (!raw) {
    throw new Error("STRAVA_TOKEN_KEY is not set. See .env.example.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("STRAVA_TOKEN_KEY must be 32 bytes (base64).");
  }
  return key;
}

export function encryptToken(
  plain: string,
  key: Buffer = keyFromEnv(),
): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv, tag, ciphertext]
    .map((part) =>
      typeof part === "string" ? part : part.toString("base64url"),
    )
    .join(".");
}

export function decryptToken(
  value: string,
  key: Buffer = keyFromEnv(),
): string {
  const [version, iv, tag, ciphertext] = value.split(".");
  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error("Unknown token format");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
