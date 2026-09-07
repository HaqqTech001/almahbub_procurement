import { expect, test } from "@playwright/test";

test.describe("phase 03.0 workspace visual chrome", () => {
  test("dashboard preview has no activity bullet list at 1280", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/__e2e__/workspace-shell");
    await expect(page.locator(".hamd-workspace-home__header h1")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator(".hamd-workspace-home__timeline")).toHaveCount(0);
    await page.screenshot({
      path: "test-results/phase-03-0-web-dashboard-1280.png",
      fullPage: true,
    });
  });

  test("dashboard preview is left aligned at 375", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/__e2e__/workspace-shell");
    await expect(page.locator(".hamd-workspace-home__header h1")).toBeVisible({
      timeout: 30_000,
    });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return Math.max(doc.scrollWidth, document.body.scrollWidth) - doc.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(8);
    await page.screenshot({
      path: "test-results/phase-03-0-web-dashboard-375.png",
      fullPage: true,
    });
  });
});
