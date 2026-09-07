import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "375", width: 375, height: 812 },
  { name: "430", width: 430, height: 932 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1440", width: 1440, height: 900 },
] as const;

test.describe("phase 02.9 ops visual chrome", () => {
  for (const viewport of VIEWPORTS) {
    test(`login has no horizontal overflow at ${viewport.name}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/login");
      await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: Math.max(doc.scrollWidth, document.body.scrollWidth),
          clientWidth: doc.clientWidth,
        };
      });
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 2);
      await page.screenshot({
        path: `test-results/phase-02-9-ops-login-${viewport.name}.png`,
        fullPage: true,
      });
    });
  }

  test("login dark theme keeps heading contrast", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");
    const toggle = page.getByRole("button", { name: /theme/i });
    if (await toggle.count()) {
      await toggle.click();
    }
    const heading = page.getByRole("heading", { name: /sign in/i });
    await expect(heading).toBeVisible();
    const contrast = await heading.evaluate((node) => {
      const styles = getComputedStyle(node);
      return { color: styles.color, background: getComputedStyle(document.body).backgroundColor };
    });
    expect(contrast.color).not.toMatch(/rgb\(16,\s*24,\s*40\)/);
    await page.screenshot({ path: "test-results/phase-02-9-ops-login-375-dark.png", fullPage: true });
  });
});
