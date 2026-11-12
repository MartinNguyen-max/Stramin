import { z } from "zod";
import {
  type AuthErrorKey,
  MAX_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  NAME_PATTERN,
} from "./form-state";

// The constants and form states live in form-state.ts (no zod, so client forms stay small).
export * from "./form-state";

// Trim and lowercase first, then validate, so " Martin@Example.com " is accepted.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "invalidEmail" }));
const password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, { error: "passwordTooShort" })
  .max(72, { error: "passwordTooLong" });

/** Trims and collapses spaces, then validates. A dot followed by letters (".com") is rejected, so no links. */
export const nameSchema = z
  .string({ error: "nameRequired" })
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(1, { error: "nameRequired" })
      .max(MAX_NAME_LENGTH, { error: "nameTooLong" })
      .regex(NAME_PATTERN, { error: "nameInvalid" })
      .refine((value) => !/\.\p{L}{2,}/u.test(value), {
        error: "nameInvalid",
      }),
  );

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "passwordRequired" }),
});

export const signupSchema = z.object({ name: nameSchema, email, password });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({ password });

/** Returns the first validation error as a translatable key. */
export function firstErrorKey(error: z.ZodError): AuthErrorKey {
  return (error.issues[0]?.message as AuthErrorKey) ?? "generic";
}
