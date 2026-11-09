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

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "passwordRequired" }),
});

export const signupSchema = z.object({ email, password });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({ password });

/** Error keys shown to the user. Each one has a translation in `Auth.errors`. */
export type AuthErrorKey =
  | "invalidEmail"
  | "passwordTooShort"
  | "passwordTooLong"
  | "passwordRequired"
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "emailTaken"
  | "rateLimited"
  | "notConfigured"
  | "generic";

export type AuthFormState =
  | { status: "idle" }
  | { status: "error"; error: AuthErrorKey }
  | { status: "success"; message: "checkEmail" | "resetSent" };

export const initialAuthState: AuthFormState = { status: "idle" };

/** Returns the first validation error as a translatable key. */
export function firstErrorKey(error: z.ZodError): AuthErrorKey {
  return (error.issues[0]?.message as AuthErrorKey) ?? "generic";
}
