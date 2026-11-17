"use client";

import { Info } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A small ⓘ button that opens a short explanation below it (owner feedback 2026-11-17). Tap or click
 * to open; tap outside or press Escape to close. Works the same on phones and PCs (no hover needed).
 */
export function InfoTip({
  label,
  children,
  className,
}: {
  /** For screen readers, e.g. "About this comparison". */
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
      >
        <Info className="size-4" />
      </button>
      {open && (
        <div
          id={id}
          role="note"
          className="absolute top-8 right-0 z-20 w-64 max-w-[calc(100vw-3rem)] rounded-xl border bg-popover p-3 text-xs leading-relaxed text-popover-foreground shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  );
}
