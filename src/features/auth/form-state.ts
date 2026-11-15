/**
 * The auth forms' constants and states, without zod, so the login, signup and settings pages don't
 * ship the validation library to the browser (performance, 2026-11-12). The schemas are in `schemas.ts`.
 */

/** Minimum password length. Supabase's own minimum is 6; we require more. */
export const MIN_PASSWORD_LENGTH = 8;

/** Max length of the name ("What should we call you?", ACC-5). */
export const MAX_NAME_LENGTH = 30;

/** Starts with a letter, then letters from any language, spaces, `-`, `'`, `’` and `.`. */
export const NAME_PATTERN = /^\p{L}[\p{L}\p{M} .'’-]*$/u;

/** The same rule for the browser's `pattern` attribute (compiled with the `v` flag). */
export const NAME_HTML_PATTERN = "\\p{L}[\\p{L}\\p{M} .'’\\-]*";

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
