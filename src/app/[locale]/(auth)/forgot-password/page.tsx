import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { requestPasswordReset } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthForm } from "@/features/auth/components/auth-form";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");
  return { title: `${t("forgot.title")} · Stramin` };
}

/** Request a password reset email (ACC-1). */
export default function ForgotPasswordPage() {
  const t = useTranslations("Auth");

  return (
    <AuthCard
      title={t("forgot.title")}
      footer={
        <Link href="/login" className="underline underline-offset-4">
          {t("forgot.back")}
        </Link>
      }
    >
      <p className="text-sm text-muted-foreground">{t("forgot.intro")}</p>
      <AuthForm
        action={requestPasswordReset}
        fields={["email"]}
        submitLabel={t("forgot.submit")}
      />
    </AuthCard>
  );
}
