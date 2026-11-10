import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ZoneSpinner } from "@/components/brand/zone-spinner";
import { signIn } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthForm } from "@/features/auth/components/auth-form";
import { ContinueAs } from "@/features/auth/components/continue-as";
import { GoogleButton } from "@/features/auth/components/google-button";
import { getSavedLogin } from "@/features/auth/current-user";
import { Link } from "@/i18n/navigation";
import { isGoogleAuthEnabled } from "@/lib/supabase/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");
  return { title: `${t("login.title")} · Stramin` };
}

/** Log in (ACC-1). With a saved login it offers "Continue as …" instead (ACC-3). */
export default function LoginPage() {
  const t = useTranslations("Auth");

  return (
    <AuthCard
      title={t("login.title")}
      footer={
        <>
          <Link
            href="/forgot-password"
            className="underline underline-offset-4"
          >
            {t("login.forgotPassword")}
          </Link>
          <p>
            {t("login.noAccount")}{" "}
            <Link
              href="/signup"
              className="font-medium text-foreground underline underline-offset-4"
            >
              {t("signup.title")}
            </Link>
          </p>
        </>
      }
    >
      {/* The session is read inside Suspense, so the page shell stays static. */}
      <Suspense
        fallback={
          <ZoneSpinner label={t("pleaseWait")} className="self-center py-6" />
        }
      >
        <LoginOptions />
      </Suspense>
    </AuthCard>
  );
}

async function LoginOptions() {
  const saved = await getSavedLogin();
  if (saved) {
    return <ContinueAs name={saved.name} email={saved.email} />;
  }

  const t = await getTranslations("Auth");
  return (
    <>
      {isGoogleAuthEnabled && (
        <>
          <GoogleButton />
          <p className="text-center text-xs text-muted-foreground">{t("or")}</p>
        </>
      )}
      <AuthForm
        action={signIn}
        fields={["email", "password"]}
        submitLabel={t("login.submit")}
      />
    </>
  );
}
