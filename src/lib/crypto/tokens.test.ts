import { randomBytes } from "node:crypto";
import { describe, expect, test } from "vitest";
import { decryptToken, encryptToken } from "./tokens";

describe("token encryption", () => {
  const key = randomBytes(32);

  test("round trip", () => {
    const encrypted = encryptToken("abc123token", key);
    expect(encrypted).toMatch(/^v1\./);
    expect(encrypted).not.toContain("abc123token");
    expect(decryptToken(encrypted, key)).toBe("abc123token");
  });

  test("a new IV every time", () => {
    expect(encryptToken("same", key)).not.toBe(encryptToken("same", key));
  });

  test("tampering or a wrong key fails", () => {
    const encrypted = encryptToken("secret", key);
    const parts = encrypted.split(".");
    parts[3] = Buffer.from("other").toString("base64url");
    expect(() => decryptToken(parts.join("."), key)).toThrow();
    expect(() => decryptToken(encrypted, randomBytes(32))).toThrow();
    expect(() => decryptToken("v2.a.b.c", key)).toThrow();
  });
});
