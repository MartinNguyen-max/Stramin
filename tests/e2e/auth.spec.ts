import { expect, test } from "@playwright/test";

test("app pages require login", async ({ page }) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/da/settings");
  await expect(page).toHaveURL(/\/da\/login$/);
});

test("landing page links to sign up and log in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign up free" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Sign up" }),
  ).toBeVisible();
});

test("sign-up form validates the password length", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("What should we call you?").fill("Martin");
  await page.getByLabel("Email").fill("someone@example.com");
  // Bypass the browser's own minlength check to test the server-side validation.
  await page
    .getByLabel("Password")
    .evaluate((input) => input.removeAttribute("minlength"));
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator("form [role=alert]")).toContainText(
    "at least 8 characters",
  );
});

// The full flow needs a running Supabase (local: `pnpm db:start`). Skipped in CI.
test.describe("account flow", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SUPABASE_URL,
    "Supabase is not configured",
  );

  test("sign up, change settings, log out and log in again", async ({
    page,
  }, testInfo) => {
    const email = `e2e-${Date.now()}-${testInfo.project.name}@example.com`;
    const password = "correct-horse-battery";

    // Sign up (local Supabase has email confirmation off, so this logs in directly).
    await page.goto("/signup");
    await page.getByLabel("What should we call you?").fill("Martin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Martin",
    );

    // With a saved login, Log in offers "Continue as …" instead of logging in silently.
    await page.goto("/login");
    await page.getByRole("button", { name: "Continue as Martin" }).click();
    await expect(page).toHaveURL(/\/home$/);

    // Change and persist a setting (stored in `profiles`, protected by RLS).
    await page.getByRole("link", { name: "Settings" }).click();
    await page.getByLabel("Units").selectOption("imperial");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Units")).toHaveValue("imperial");

    // Log out, then log in again.
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/home$/);
  });

  test("wrong password shows an error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.locator("form [role=alert]")).toContainText(
      "Wrong email or password",
    );
  });
});
