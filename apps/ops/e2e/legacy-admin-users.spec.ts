import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import { loginOps, openAdminNav, opsEmail, opsPassword } from "./admin-helpers.js";

const VIEWPORTS = [
  { width: 320, height: 720 },
  { width: 360, height: 740 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

test.describe("ops user administration", () => {
  test("users module is an administrative surface, not a buyer account page", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.skip(!opsEmail || !opsPassword, "HAMD_OPS_E2E_EMAIL / HAMD_OPS_E2E_PASSWORD required");
    test.setTimeout(180_000);

    await loginOps(page);
    await openAdminNav(page, /^users$/i);
    await expect(page.getByRole("heading", { name: /^users$/i })).toBeVisible();
    await expect(page.getByText(/manage almahbub accounts/i)).toBeVisible();
    await expect(page.getByText(/read-only directory/i)).toHaveCount(0);
    await expect(page.getByLabel(/search/i)).toBeVisible();
    await expect(page.getByLabel(/^status$/i)).toBeVisible();
  });

  test("users page remains usable across required viewports", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.skip(!opsEmail || !opsPassword, "HAMD_OPS_E2E_EMAIL / HAMD_OPS_E2E_PASSWORD required");
    test.setTimeout(240_000);

    await loginOps(page);
    await openAdminNav(page, /^users$/i);

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await expect(page.getByRole("heading", { name: /^users$/i })).toBeVisible();
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("users page axe WCAG AA on desktop", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.skip(!opsEmail || !opsPassword, "HAMD_OPS_E2E_EMAIL / HAMD_OPS_E2E_PASSWORD required");
    test.setTimeout(180_000);

    await loginOps(page);
    await openAdminNav(page, /^users$/i);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
