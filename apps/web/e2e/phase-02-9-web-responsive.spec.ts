import { expect, test } from "@playwright/test";

test.describe("phase 02.9 web visual chrome", () => {
  test("public home has no overflow at 375px", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: Math.max(doc.scrollWidth, document.body.scrollWidth),
        clientWidth: doc.clientWidth,
      };
    });
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 8);
    await page.screenshot({
      path: "test-results/phase-02-9-web-home-375.png",
      fullPage: true,
    });
  });
});
