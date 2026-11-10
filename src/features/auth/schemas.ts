import { z } from "zod";

/** Minimum password length. Supabase's own minimum is 6; we require more. */
export const MIN_PASSWORD_LENGTH = 8;

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

/** Max length of the name ("What should we call you?", ACC-5). */
export const MAX_NAME_LENGTH = 30;

/** Starts with a letter, then letters from any language, spaces, `-`, `'`, `’` and `.`. */
const NAME_PATTERN = /^\p{L}[\p{L}\p{M} .'’-]*$/u;

/** The same rule for the browser's `pattern` attribute (compiled with the `v` flag). */
export const NAME_HTML_PATTERN = "\\p{L}[\\p{L}\\p{M} .'’\\-]*";

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

/** Error keys shown to the user. Each one has a translation in `Auth.errors`. */
export type AuthErrorKey =
  | "invalidEmail"
  | "passwordTooShort"
  | "passwordTooLong"
  | "passwordRequired"
  | "nameRequired"
  | "nameTooLong"
  | "nameInvalid"
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "emailTaken"
  | "rateLimited"
  | "notConfigured"
  | "generic";

export type AuthFormState =
  | { status: "idle" }
  /** `email` and `name` are sent back so the form can keep them after a failed attempt. */
  | { status: "error"; error: AuthErrorKey; email?: string; name?: string }
  | { status: "success"; message: "checkEmail" | "resetSent" };

export const initialAuthState: AuthFormState = { status: "idle" };

/** The "Name" form in Settings (ACC-5). */
export type NameFormState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; error: AuthErrorKey };

/** Returns the first validation error as a translatable key. */
export function firstErrorKey(error: z.ZodError): AuthErrorKey {
  return (error.issues[0]?.message as AuthErrorKey) ?? "generic";
}
