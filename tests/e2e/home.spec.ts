import { expect, test } from "@playwright/test";

test("English is the default language at /", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText("Your training, finally clear.")).toBeVisible();
});

test("Danish is served at /da", async ({ page }) => {
  await page.goto("/da");
  await expect(page.locator("html")).toHaveAttribute("lang", "da");
  await expect(
    page.getByText("Din træning, endelig overskuelig."),
  ).toBeVisible();
});
