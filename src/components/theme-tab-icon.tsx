"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

/**
 * Makes the browser tab icon follow the chosen theme, also when it differs from the device's
 * (`icon.svg` alone can only follow the device). The home screen icons stay light.
 */
export function ThemeTabIcon() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;
    const href = `/brand/stramin-icon-${resolvedTheme}.svg`;
    for (const link of document.querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"][type="image/svg+xml"]',
    )) {
      link.href = href;
    }
  }, [resolvedTheme]);
  return null;
}
