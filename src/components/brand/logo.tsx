import Image from "next/image";
import { cn } from "@/lib/utils";

const ZONES = [
  "bg-zone-1",
  "bg-zone-2",
  "bg-zone-3",
  "bg-zone-4",
  "bg-zone-5",
] as const;

type LogoProps = {
  /** Icon height in px. The wordmark scales with it. */
  size?: number;
  className?: string;
};

/**
 * Stramin logo: the heart-rate gauge icon followed by the wordmark.
 * The icon swaps between the light and dark version with the theme.
 * The wordmark is rendered as text in the brand font (Rubik Black), so it stays sharp and theme-aware.
 */
export function Logo({ size = 32, className }: LogoProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="Stramin"
      role="img"
    >
      <Image
        src="/brand/stramin-icon-light.svg"
        alt=""
        width={size}
        height={size}
        className="dark:hidden"
        unoptimized
        priority
      />
      <Image
        src="/brand/stramin-icon-dark.svg"
        alt=""
        width={size}
        height={size}
        className="hidden dark:block"
        unoptimized
        priority
      />
      <span className="inline-flex flex-col gap-[0.12em]" aria-hidden>
        <span
          className="font-brand font-black leading-none tracking-tight"
          style={{ fontSize: size * 0.75 }}
        >
          stramin
        </span>
        <span className="flex gap-[0.15em]" style={{ height: size * 0.07 }}>
          {ZONES.map((zone) => (
            <span key={zone} className={cn("flex-1 rounded-full", zone)} />
          ))}
        </span>
      </span>
    </span>
  );
}
