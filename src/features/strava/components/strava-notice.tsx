import { useTranslations } from "next-intl";

const CODES = ["denied", "failed", "scope", "taken"] as const;
type Code = (typeof CODES)[number];

/** Shown after "Connect with Strava" didn't work (the callback adds `?strava=<code>`). */
export function StravaNotice({
  code,
}: {
  code: string | string[] | undefined;
}) {
  const t = useTranslations("Strava.notice");
  const value = Array.isArray(code) ? code[0] : code;
  if (!value || !(CODES as readonly string[]).includes(value)) return null;
  return (
    <p
      role="alert"
      className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
    >
      {t(value as Code)}
    </p>
  );
}
