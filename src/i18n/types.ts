import type messages from "../messages/en.json";
import type { routing } from "./routing";

// Makes translation keys and locales type-safe. English is the source of truth for keys.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
