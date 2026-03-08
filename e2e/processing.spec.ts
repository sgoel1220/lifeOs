import { test, expect } from "@playwright/test";

test.describe("AI processing pipeline", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign-in and authenticate
    await page.goto("/sign-in");
    // Fill in credentials — assumes test user exists
    const email = process.env.TEST_USER_EMAIL ?? "test@example.com";
    const password = process.env.TEST_USER_PASSWORD ?? "password";
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/");
  });

  test("dump triggers AI processing and creates a task", async ({ page, request }) => {
    await page.goto("/");

    const textarea = page.getByPlaceholder(/what's on your mind/i).or(page.locator("textarea"));
    await textarea.fill("call dentist tomorrow");
    await page.keyboard.press("Meta+Enter");

    // Wait for the dump to be created (optimistic UI)
    await expect(page.getByText("call dentist tomorrow")).toBeVisible({ timeout: 5000 });

    // Poll for processed items (AI can take up to 10s)
    let found = false;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(500);
      const response = await request.get("/api/items?type=TASK&status=PENDING");
      if (response.ok()) {
        const data = await response.json();
        if (data.items?.length > 0) {
          found = true;
          break;
        }
      }
    }

    expect(found).toBe(true);

    // Verify task appears on /tasks
    await page.goto("/tasks");
    await expect(page.getByText(/dentist/i)).toBeVisible({ timeout: 5000 });
  });
});
