import { cn } from "@/lib/utils";

/** The five heart-rate zone arcs from the logo, low (Z1) to high (Z5). */
const ZONE_ARCS = [
  { d: "M 106.2 292.1 A 150 150 0 0 1 130.2 218.3", color: "var(--zone-1)" },
  { d: "M 139.4 205.6 A 150 150 0 0 1 202.2 160.0", color: "var(--zone-2)" },
  { d: "M 217.2 155.1 A 150 150 0 0 1 294.8 155.1", color: "var(--zone-3)" },
  { d: "M 309.8 160.0 A 150 150 0 0 1 372.6 205.6", color: "var(--zone-4)" },
  { d: "M 381.8 218.3 A 150 150 0 0 1 405.8 292.1", color: "var(--zone-5)" },
];

/**
 * Stramin's loading spinner: the logo's heart-rate gauge. The needle sweeps from zone 1 to zone 5
 * and each zone lights up as it passes, then it starts over. Pure SVG + CSS (see `globals.css`).
 * With "reduce motion" turned on in the OS, it shows a still gauge instead.
 */
export function ZoneSpinner({
  size = 48,
  label,
  className,
}: {
  size?: number;
  /** Text shown below the gauge and read out by screen readers. */
  label: string;
  className?: string;
}) {
  return (
    <output
      className={cn("inline-flex flex-col items-center gap-3", className)}
    >
      <svg
        width={size}
        height={size}
        viewBox="80 120 352 210"
        aria-hidden="true"
        className="zone-spinner overflow-visible"
      >
        {ZONE_ARCS.map((arc) => (
          <path
            key={arc.d}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={40}
            className="zone-spinner-arc"
          />
        ))}
        <g className="zone-spinner-needle">
          <line
            x1="256"
            y1="300"
            x2="325.4"
            y2="204.5"
            stroke="currentColor"
            strokeWidth={16}
            strokeLinecap="round"
          />
          <circle cx="256" cy="300" r="22" fill="currentColor" />
        </g>
      </svg>
      <span className="text-sm text-muted-foreground">{label}</span>
    </output>
  );
}
