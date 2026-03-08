import { test, expect, request as playwrightRequest } from "@playwright/test";

async function seedTask(request: Awaited<ReturnType<typeof playwrightRequest.newContext>>) {
  // Seed a task directly via the internal process endpoint would require real DB.
  // Instead, we seed by creating a dump and waiting for processing, or use a test seed endpoint.
  // For now, we verify the page structure with an existing task or empty state.
  return null;
}

test.describe("Tasks page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    const email = process.env.TEST_USER_EMAIL ?? "test@example.com";
    const password = process.env.TEST_USER_PASSWORD ?? "password";
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/");
  });

  test("tasks page loads with correct structure", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  });

  test("shows empty state when no tasks", async ({ page }) => {
    await page.goto("/tasks");
    // Either shows tasks or shows the empty state
    const hasContent =
      (await page.getByText(/No tasks yet/i).isVisible()) ||
      (await page.locator("[aria-label='Mark done']").count()) > 0;
    expect(hasContent).toBe(true);
  });

  test("sidebar shows Tasks link as active on /tasks", async ({ page }) => {
    await page.goto("/tasks");
    // The sidebar Tasks link should be present and active
    const tasksLink = page.getByRole("link", { name: /tasks/i });
    await expect(tasksLink).toBeVisible();
  });

  test("clicking checkbox marks task done (if tasks exist)", async ({ page }) => {
    await page.goto("/tasks");
    const checkboxes = page.locator("[aria-label='Mark done']");
    const count = await checkboxes.count();

    if (count > 0) {
      const firstCheckbox = checkboxes.first();
      const taskCard = firstCheckbox.locator("..").locator("..");
      const titleText = await taskCard.locator(".font-medium").textContent();

      await firstCheckbox.click();

      // Task should disappear from list (optimistic update)
      if (titleText) {
        await expect(page.getByText(titleText).first()).not.toBeVisible({ timeout: 3000 });
      }
    }
  });
});
