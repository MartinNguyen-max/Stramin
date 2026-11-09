import { describe, expect, test } from "vitest";
import { firstErrorKey, loginSchema, signupSchema } from "./schemas";

describe("signupSchema", () => {
  test("accepts a valid email and password, and normalizes the email", () => {
    const result = signupSchema.safeParse({
      email: "  Martin@Example.com ",
      password: "long-enough",
    });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("martin@example.com");
  });

  test("rejects a short password with a translatable key", () => {
    const result = signupSchema.safeParse({
      email: "martin@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstErrorKey(result.error)).toBe("passwordTooShort");
    }
  });

  test("rejects an invalid email", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      password: "long-enough",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstErrorKey(result.error)).toBe("invalidEmail");
    }
  });
});

describe("loginSchema", () => {
  test("requires a password but not a minimum length", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.dk", password: "x" }).success,
    ).toBe(true);
    const empty = loginSchema.safeParse({ email: "a@b.dk", password: "" });
    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(firstErrorKey(empty.error)).toBe("passwordRequired");
    }
  });
});
