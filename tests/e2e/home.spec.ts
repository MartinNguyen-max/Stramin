import { expect, test } from "@playwright/test";

// Smoke test: proves the Playwright setup works. Replaced when the landing page is built.
test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
