import { expect, test } from "@playwright/test";

import { loginOps, openAdminNav, opsEmail, opsPassword } from "./admin-helpers.js";

const email = opsEmail;
const password = opsPassword;

test.describe("phase 6b ops smoke", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.skip(!email || !password, "HAMD_OPS_E2E_EMAIL / HAMD_OPS_E2E_PASSWORD required");
  });

  test("dashboard, products, and announcements stay authenticated", async ({ page }) => {
    test.setTimeout(120_000);
    await loginOps(page);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator(".hamd-skeleton[aria-busy='true']")).toHaveCount(0);

    await openAdminNav(page, /^products$/i);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /product/i }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator(".hamd-skeleton[aria-busy='true']")).toHaveCount(0);

    await openAdminNav(page, /^announcements$/i);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /announcement/i }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator(".hamd-skeleton[aria-busy='true']")).toHaveCount(0);
  });
});
