import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Next.js loads .env.local for the app; drizzle-kit runs outside Next, so load it here (Node built-in).
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

// Drizzle generates SQL migrations from the TypeScript schema.
// They are written into supabase/migrations, so the Supabase CLI applies them (ADR 0003).
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema",
  out: "./supabase/migrations",
  migrations: {
    prefix: "supabase",
  },
  // Supabase manages its own roles (anon, authenticated, …). Don't try to create them.
  entities: {
    roles: { provider: "supabase" },
  },
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: drizzle-kit fails with a clear message if it is missing.
    url: process.env.DATABASE_URL!,
  },
});
