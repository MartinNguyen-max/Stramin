import { useTranslations } from "next-intl";
import { PageSkeleton, type SkeletonLayout } from "@/components/page-skeleton";

/** Loading state for the demo pages: the page's skeleton with the spinner. */
export function DemoSpinner({ layout }: { layout: SkeletonLayout }) {
  const t = useTranslations("Demo");
  return <PageSkeleton layout={layout} label={t("loading")} />;
}
