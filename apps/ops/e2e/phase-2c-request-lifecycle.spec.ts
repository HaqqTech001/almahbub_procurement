import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import {
  buyerEmail,
  buyerPassword,
  loginOps,
  openAdminNav,
  opsEmail,
  opsPassword,
} from "./admin-helpers.js";

test.describe("phase 2c admin request lifecycle", () => {
  test.setTimeout(180_000);

  test("ops can open requests hub and users detail without page overflow", async ({
    page,
  }, testInfo) => {
    test.skip(
      !opsEmail || !opsPassword,
      "HAMD_OPS_E2E_EMAIL / HAMD_OPS_E2E_PASSWORD required",
    );

    await loginOps(page);
    await openAdminNav(page, /requests/i);
    await expect(page).toHaveURL(/\/requests/);
    await expect(page.getByRole("heading", { name: /all requests/i })).toBeVisible({
      timeout: 45_000,
    });

    const firstView = page.getByRole("button", { name: /^view$/i }).first();
    if (await firstView.count()) {
      await firstView.click();
      await expect(page).toHaveURL(/\/requests\/[^/]+/);
      await expect(page.getByText(/operations request|lifecycle/i).first()).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByRole("heading", { name: /^request$/i })).toBeVisible();
    }

    await openAdminNav(page, /users/i);
    await expect(page.getByRole("heading", { name: /^users$/i })).toBeVisible();

    if (testInfo.project.name.includes("mobile") || testInfo.project.name.includes("390")) {
      await page.setViewportSize({ width: 390, height: 844 });
    }

    const viewUser = page.getByRole("button", { name: /^view$/i }).first();
    if (await viewUser.count()) {
      await viewUser.click();
      await expect(page.getByRole("heading", { name: /user details/i })).toBeVisible();
      await expect(page.getByText(/← users/i).or(page.getByRole("button", { name: /close/i }))).toBeVisible();
    }

    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(
        () =>
          Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) -
          document.documentElement.clientWidth,
      );
      expect(overflow, `overflow at ${width}`).toBeLessThanOrEqual(1);
    }

    if (testInfo.project.name === "chromium-desktop") {
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(accessibility.violations).toEqual([]);
    }
  });

  test("buyer remains unauthorized in admin", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.skip(
      !buyerEmail || !buyerPassword,
      "HAMD_BUYER_E2E_EMAIL / HAMD_BUYER_E2E_PASSWORD required",
    );
    await page.goto("/login");
    await page.getByRole("textbox", { name: /email/i }).fill(buyerEmail);
    await page.locator('input[type="password"][name="password"]').fill(buyerPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/unauthorized/, { timeout: 30_000 });
  });
});
