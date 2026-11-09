import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { signUp } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthForm } from "@/features/auth/components/auth-form";
import { GoogleButton } from "@/features/auth/components/google-button";
import { Link } from "@/i18n/navigation";
import { isGoogleAuthEnabled } from "@/lib/supabase/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");
  return { title: `${t("signup.title")} · Stramin` };
}

/** Sign up (ACC-1). */
export default function SignupPage() {
  const t = useTranslations("Auth");

  return (
    <AuthCard
      title={t("signup.title")}
      footer={
        <>
          <p>
            {t.rich("signup.consent", {
              privacy: (chunks) => (
                <Link href="/privacy" className="underline underline-offset-4">
                  {chunks}
                </Link>
              ),
            })}
          </p>
          <p>
            {t("signup.haveAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline underline-offset-4"
            >
              {t("login.title")}
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
        action={signUp}
        fields={["email", "newPassword"]}
        submitLabel={t("signup.submit")}
      />
    </AuthCard>
  );
}
