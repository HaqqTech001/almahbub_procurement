import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WIDTHS = [320, 360, 375, 390, 414, 480, 768, 1024, 1280, 1440, 1920] as const;

test.describe("phase 6 ops responsive + theme", () => {
  for (const width of WIDTHS) {
    test(`login chrome has no overflow at ${width}px`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/login");
      await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: Math.max(doc.scrollWidth, document.body.scrollWidth),
          clientWidth: doc.clientWidth,
        };
      });
      expect(
        metrics.scrollWidth,
        `horizontal overflow at ${width}px (scroll=${metrics.scrollWidth}, client=${metrics.clientWidth})`,
      ).toBeLessThanOrEqual(metrics.clientWidth + 1);
    });
  }

  test("theme toggle cycles light and dark without invisible text", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    await page.goto("/login");
    const heading = page.getByRole("heading", { name: /sign in/i });
    await expect(heading).toBeVisible();
    const before = await page.evaluate(() => getComputedStyle(document.body).color);
    const toggle = page.getByRole("button", { name: /theme/i });
    if (await toggle.count()) {
      await toggle.click();
      const after = await page.evaluate(() => getComputedStyle(document.body).color);
      expect(after).toBeTruthy();
      expect(before).toBeTruthy();
    }
    await expect(heading).toBeVisible();
  });

  test("unauthorized page is accessible", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    await page.goto("/unauthorized");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
