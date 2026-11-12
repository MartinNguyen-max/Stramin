"use client";

import type { ComponentProps } from "react";

/**
 * A `<details>` that closes again when you leave the page (owner feedback 2026-11-12, batch 6: "keep
 * it all clean"). With Cache Components, Next.js hides a page you leave instead of unmounting it, so
 * an opened `<details>` would still be open when you come back. When the page is hidden, React runs
 * the ref's cleanup, which closes it (see `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`).
 */
export function Details(props: ComponentProps<"details">) {
  return (
    <details
      {...props}
      ref={(element) => () => {
        if (element) element.open = false;
      }}
    />
  );
}
