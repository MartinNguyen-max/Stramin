"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) in production, so Stramin can be installed as an app
 * and shows an offline page without a connection (M11). Not in development: it would get in the way
 * of hot reloading.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) => console.error("[pwa] service worker failed", error));
  }, []);
  return null;
}
