import type { MetadataRoute } from "next";

/**
 * The web app manifest (M11, owner feedback 2026-11-12): Stramin can be installed on the phone's home
 * screen and opens full screen, straight into Home.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stramin",
    short_name: "Stramin",
    description:
      "Your swim, bike, run and strength training from Strava: a clear calendar, best efforts and goals.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#14141A",
    theme_color: "#14141A",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
