import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolves the "@/..." import alias from tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    // Unit tests live next to the code they test. E2E tests (Playwright) live in tests/e2e.
    include: ["src/**/*.test.{ts,tsx}"],
    // No unit tests yet. The first real ones come with the analytics code (M7).
    passWithNoTests: true,
  },
});
