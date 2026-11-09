import { expect, test } from "@playwright/test";

test("English landing page at /", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Your training, finally clear.",
    }),
  ).toBeVisible();
});

test("Danish landing page at /da", async ({ page }) => {
  await page.goto("/da");
  await expect(page.locator("html")).toHaveAttribute("lang", "da");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Din træning, endelig overskuelig.",
    }),
  ).toBeVisible();
});

test("language switcher changes to Danish", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "da", exact: true }).click();
  await expect(page).toHaveURL(/\/da$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "da");
});

test("privacy policy is reachable from the footer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Privacy policy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Privacy policy" }),
  ).toBeVisible();
});
