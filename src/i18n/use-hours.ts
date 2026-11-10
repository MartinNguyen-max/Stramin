import { useTranslations } from "next-intl";
import { formatHours } from "@/lib/format";

/**
 * Formats durations people read as time spent: "53 min", "5:50 h" (Danish "5:50 t").
 * Works in server and client components.
 */
export function useHours(): (seconds: number) => string {
  const t = useTranslations("Units");
  const hour = t("hour");
  return (seconds) => formatHours(seconds, hour);
}
