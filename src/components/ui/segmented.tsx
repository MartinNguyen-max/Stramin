"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

/**
 * A row of pill buttons where one is chosen, like the EN/DA switch. Used in Settings, where a choice
 * applies at once (owner feedback 2026-11-12).
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  /** For screen readers; the visible label sits next to it. */
  label: string;
  options: SegmentedOption<T>[];
  /** Null while unknown (e.g. the theme before the browser has loaded). */
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex w-fit max-w-full rounded-full border p-0.5 text-sm font-medium"
    >
      {options.map((option) => {
        const selected = option.value === value;
        const Icon = option.icon;
        return (
          // biome-ignore lint/a11y/useSemanticElements: styled pills; role="radio" keeps them accessible.
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => {
              if (!selected) onChange(option.value);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 whitespace-nowrap transition-colors disabled:opacity-60",
              selected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon && <Icon className="size-4" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
