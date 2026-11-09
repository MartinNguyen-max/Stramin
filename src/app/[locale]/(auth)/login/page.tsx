import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { signIn } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthForm } from "@/features/auth/components/auth-form";
import { GoogleButton } from "@/features/auth/components/google-button";
import { Link } from "@/i18n/navigation";
import { isGoogleAuthEnabled } from "@/lib/supabase/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");
  return { title: `${t("login.title")} · Stramin` };
}

/** Log in (ACC-1). */
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
    </AuthCard>
  );
}
