import { cn } from "@/lib/utils";
import { ZoneSpinner } from "./brand/zone-spinner";

export type SkeletonLayout =
  | "home"
  | "goals"
  | "calculator"
  | "training"
  | "profile";

/**
 * The loading state of a page (owner, 2026-11-12): grey boxes in the shape of the page, so the layout
 * shows at once, with the zone spinner on top. The boxes pulse softly (not with "reduce motion").
 */
export function PageSkeleton({
  layout,
  label,
}: {
  layout: SkeletonLayout;
  /** Read out by screen readers and shown under the spinner. */
  label: string;
}) {
  return (
    <div className="relative flex flex-1 flex-col">
      <div
        aria-hidden
        className="flex flex-col gap-6 motion-safe:animate-pulse"
      >
        {LAYOUTS[layout]}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center">
        <ZoneSpinner
          size={72}
          label={label}
          className="rounded-2xl bg-background/85 px-6 py-5 shadow-sm backdrop-blur"
        />
      </div>
    </div>
  );
}

/** One grey box. */
function Box({ className }: { className?: string }) {
  return <div className={cn("rounded-2xl bg-muted", className)} />;
}

/** A bordered card with a few lines in it. */
function Card({
  className,
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div
      className={cn("flex flex-col gap-3 rounded-2xl border p-4", className)}
    >
      <Box className="h-4 w-1/3 rounded-md" />
      {Array.from({ length: lines }, (_, index) => (
        <Box
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder lines.
          key={index}
          className={cn("h-3 rounded-md", index % 2 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

function Title({ className }: { className?: string }) {
  return <Box className={cn("h-7 w-48 rounded-lg", className)} />;
}

const LAYOUTS: Record<SkeletonLayout, React.ReactNode> = {
  home: (
    <>
      <Title />
      <div className="flex gap-4 overflow-hidden">
        <Box className="h-36 w-72 shrink-0" />
        <Box className="h-36 w-72 shrink-0" />
      </div>
      <Box className="h-9 w-64 rounded-full" />
      <div className="flex flex-col gap-3 rounded-2xl border p-4">
        <Box className="h-4 w-40 rounded-md" />
        <Box className="h-16" />
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          <Box className="h-24" />
          <Box className="h-24" />
          <Box className="h-24" />
          <Box className="h-24" />
        </div>
      </div>
      <Box className="h-96" />
    </>
  ),
  goals: (
    <>
      <Title />
      <Box className="h-11 w-64 rounded-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-64" lines={5} />
        <Card className="h-64" lines={5} />
        <Card className="h-64" lines={5} />
      </div>
    </>
  ),
  calculator: (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Title />
      <Box className="h-11 w-64 rounded-full" />
      <Box className="h-9 w-72 rounded-full" />
      <Card className="h-80" lines={4} />
    </div>
  ),
  training: (
    <>
      <Title />
      <Box className="h-9 w-72 rounded-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="h-48" />
        <Card className="h-48" />
        <Card className="h-48" />
        <Card className="h-48" />
        <Card className="h-48" />
        <Card className="h-48" />
      </div>
    </>
  ),
  profile: (
    <>
      <div className="flex items-center gap-4">
        <Box className="size-14 rounded-full" />
        <Title />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="h-72" lines={6} />
        <Card className="h-72" lines={6} />
        <Card className="h-72" lines={6} />
      </div>
      <Card className="h-56" lines={4} />
    </>
  ),
};
