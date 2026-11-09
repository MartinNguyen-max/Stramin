import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { updatePassword } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { AuthForm } from "@/features/auth/components/auth-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Auth");
  return { title: `${t("reset.title")} · Stramin` };
}

/**
 * Set a new password (ACC-1). The user arrives here from the reset email,
 * already logged in through /api/auth/callback.
 */
export default function ResetPasswordPage() {
  const t = useTranslations("Auth");

  return (
    <AuthCard title={t("reset.title")}>
      <AuthForm
        action={updatePassword}
        fields={["newPassword"]}
        submitLabel={t("reset.submit")}
      />
    </AuthCard>
  );
}
