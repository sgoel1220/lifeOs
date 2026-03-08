import { test, expect } from "@playwright/test";

test.describe("Ideas page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    const email = process.env.TEST_USER_EMAIL ?? "test@example.com";
    const password = process.env.TEST_USER_PASSWORD ?? "password";
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/");
  });

  test("ideas page loads with correct structure", async ({ page }) => {
    await page.goto("/ideas");
    await expect(page.getByRole("heading", { name: "Ideas" })).toBeVisible();
  });

  test("shows empty state or idea cards", async ({ page }) => {
    await page.goto("/ideas");
    const hasContent =
      (await page.getByText(/No ideas captured yet/i).isVisible()) ||
      (await page.getByText(/Archive/i).count()) > 0;
    expect(hasContent).toBe(true);
  });

  test("archive button removes idea card (if ideas exist)", async ({ page }) => {
    await page.goto("/ideas");
    const archiveButtons = page.getByRole("button", { name: /archive/i });
    const count = await archiveButtons.count();

    if (count > 0) {
      const firstCard = archiveButtons.first().locator("../..").locator("..");
      const titleText = await firstCard.locator(".font-semibold").first().textContent();

      await archiveButtons.first().click();

      // Card should disappear (optimistic update)
      if (titleText) {
        await expect(page.getByText(titleText).first()).not.toBeVisible({ timeout: 3000 });
      }
    }
  });

  test("sidebar navigation to ideas works", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /ideas/i }).click();
    await expect(page).toHaveURL("/ideas");
    await expect(page.getByRole("heading", { name: "Ideas" })).toBeVisible();
  });
});
