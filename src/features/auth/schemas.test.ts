import { describe, expect, test } from "vitest";
import {
  firstErrorKey,
  loginSchema,
  nameSchema,
  signupSchema,
} from "./schemas";

describe("nameSchema", () => {
  test("accepts names from any language and tidies spaces", () => {
    expect(nameSchema.parse("  Martin  ")).toBe("Martin");
    expect(nameSchema.parse("Anne   Sofie")).toBe("Anne Sofie");
    for (const name of [
      "Søren",
      "Zoë",
      "Jean-Luc",
      "O'Brien",
      "D’Angelo",
      "J.R.",
      "Åse",
    ]) {
      expect(nameSchema.safeParse(name).success).toBe(true);
    }
  });

  test.each([
    ["", "nameRequired"],
    ["   ", "nameRequired"],
    ["a".repeat(31), "nameTooLong"],
    ["-Martin", "nameInvalid"],
    ["Martin2", "nameInvalid"],
    ["Martin 🏃", "nameInvalid"],
    ["<b>Martin</b>", "nameInvalid"],
    ["https://evil.com", "nameInvalid"],
    ["www.evil.com", "nameInvalid"],
  ])("rejects %j with %s", (input, key) => {
    const result = nameSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstErrorKey(result.error)).toBe(key);
    }
  });
});

describe("signupSchema", () => {
  test("accepts a valid email and password, and normalizes the email", () => {
    const result = signupSchema.safeParse({
      name: "Martin",
      email: "  Martin@Example.com ",
      password: "long-enough",
    });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("martin@example.com");
  });

  test("rejects a short password with a translatable key", () => {
    const result = signupSchema.safeParse({
      name: "Martin",
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
      name: "Martin",
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
