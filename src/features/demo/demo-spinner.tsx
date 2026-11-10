import { useTranslations } from "next-intl";
import { ZoneSpinner } from "@/components/brand/zone-spinner";

/** Loading state for the demo pages. */
export function DemoSpinner() {
  const t = useTranslations("Demo");
  return (
    <div className="flex justify-center py-24">
      <ZoneSpinner size={72} label={t("loading")} />
    </div>
  );
}
