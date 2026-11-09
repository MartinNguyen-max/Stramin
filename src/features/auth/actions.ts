"use server";

import { headers } from "next/headers";
import { localeFromForm } from "@/i18n/form-locale";
import { redirect } from "@/i18n/navigation";
import { supabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  type AuthErrorKey,
  type AuthFormState,
  firstErrorKey,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "./schemas";

/** The site's own URL, used for links in emails and OAuth redirects. */
async function getOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** The submitted email, returned on errors so the form keeps it. */
function emailOf(formData: FormData) {
  const value = formData.get("email");
  return typeof value === "string" ? value : undefined;
}

/** Translates Supabase's error codes into our own error keys. */
function mapSupabaseError(code: string | undefined): AuthErrorKey {
  switch (code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "user_already_exists":
    case "email_exists":
      return "emailTaken";
    case "weak_password":
      return "passwordTooShort";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimited";
    default:
      return "generic";
  }
}

const notConfigured: AuthFormState = {
  status: "error",
  error: "notConfigured",
};

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      error: firstErrorKey(parsed.error),
      email: emailOf(formData),
    };
  }
  if (!supabaseConfig()) return notConfigured;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return {
      status: "error",
      error: mapSupabaseError(error.code),
      email: emailOf(formData),
    };
  }

  redirect({ href: "/home", locale: localeFromForm(formData) });
  return { status: "idle" };
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      error: firstErrorKey(parsed.error),
      email: emailOf(formData),
    };
  }
  if (!supabaseConfig()) return notConfigured;

  const locale = localeFromForm(formData);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${await getOrigin()}/api/auth/callback?next=/${locale}/home`,
      data: { locale },
    },
  });
  if (error) {
    return {
      status: "error",
      error: mapSupabaseError(error.code),
      email: emailOf(formData),
    };
  }

  // With email confirmation off (local dev), Supabase logs the user in right away.
  if (data.session) {
    redirect({ href: "/home", locale });
  }
  return { status: "success", message: "checkEmail" };
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      error: firstErrorKey(parsed.error),
      email: emailOf(formData),
    };
  }
  if (!supabaseConfig()) return notConfigured;

  const locale = localeFromForm(formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${await getOrigin()}/api/auth/callback?next=/${locale}/reset-password`,
    },
  );
  // Don't reveal whether the email exists. Only rate limits are reported.
  if (error && mapSupabaseError(error.code) === "rateLimited") {
    return { status: "error", error: "rateLimited", email: emailOf(formData) };
  }
  return { status: "success", message: "resetSent" };
}

export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      error: firstErrorKey(parsed.error),
      email: emailOf(formData),
    };
  }
  if (!supabaseConfig()) return notConfigured;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return {
      status: "error",
      error: mapSupabaseError(error.code),
      email: emailOf(formData),
    };
  }

  redirect({ href: "/home", locale: localeFromForm(formData) });
  return { status: "idle" };
}

export async function signInWithGoogle(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!supabaseConfig()) return notConfigured;

  const locale = localeFromForm(formData);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await getOrigin()}/api/auth/callback?next=/${locale}/home`,
    },
  });
  if (error || !data.url) {
    return { status: "error", error: "generic" };
  }

  redirect({ href: data.url, locale });
  return { status: "idle" };
}

export async function signOut(formData: FormData) {
  const locale = localeFromForm(formData);
  if (supabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect({ href: "/", locale });
}
