import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const IE = "/businesses/almahbub-integrated-export";
const HOME = IE;
const CATALOGUE = `${IE}/commodities`;

async function dismissOverlays(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("hamd.web.cookie-consent", "essential");
    window.localStorage.setItem(
      "hamd.web.guidance.preference",
      JSON.stringify({
        mode: "off",
        neverAutoStart: true,
        welcomeCompletedAt: "2026-01-01T00:00:00.000Z",
        locale: "en",
        suppressedTourKeys: [],
      }),
    );
  });
}

async function overflowPx(page: Page): Promise<number> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(doc.scrollWidth, document.body.scrollWidth) - doc.clientWidth;
  });
}

test.describe("IE-9 commodity population gate", () => {
  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page);
  });

  test("lists an empty published catalogue without prices and keeps enquiry CTAs", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(120_000);

    for (const width of [1024, 1280, 1440, 1920] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(CATALOGUE);
      await expect(page.locator(".hamd-aie-catalogue")).toBeVisible({ timeout: 30_000 });
      await expect(
        page.getByRole("heading", { name: /no commodities published yet/i }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Sesame Seeds", exact: true })).toHaveCount(0);
      await expect(page.getByText(/add to cart/i)).toHaveCount(0);
      await expect(page.getByText(/moisture\s*:\s*\d/i)).toHaveCount(0);
      expect(await overflowPx(page)).toBeLessThanOrEqual(1);
    }

    await page.goto(HOME);
    await expect(page.locator(".hamd-aie-home")).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: /no commodities published yet/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sesame Seeds", exact: true })).toHaveCount(0);
  });

  test("mobile catalogue empty state has no overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "viewport control");
    test.setTimeout(120_000);

    for (const width of [320, 360, 375, 390, 414, 768] as const) {
      await page.setViewportSize({ width, height: 812 });
      await page.goto(CATALOGUE);
      await expect(page.locator(".hamd-aie-catalogue")).toBeVisible({ timeout: 30_000 });
      expect(await overflowPx(page)).toBeLessThanOrEqual(1);
    }
  });

  test("axe WCAG AA on published catalogue and IE homepage", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(180_000);

    for (const theme of ["light", "dark"] as const) {
      for (const path of [HOME, CATALOGUE] as const) {
        const context = await browser.newContext();
        await context.addInitScript((value) => {
          window.localStorage.setItem("hamd.web.theme", value);
          window.localStorage.setItem("hamd.web.cookie-consent", "essential");
          window.localStorage.setItem(
            "hamd.web.guidance.preference",
            JSON.stringify({
              mode: "off",
              neverAutoStart: true,
              welcomeCompletedAt: "2026-01-01T00:00:00.000Z",
              locale: "en",
              suppressedTourKeys: [],
            }),
          );
        }, theme);
        const page = await context.newPage();
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(path);
        await expect(
          page.locator(path.endsWith("/commodities") ? ".hamd-aie-catalogue" : ".hamd-aie-home"),
        ).toBeVisible({ timeout: 30_000 });
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa"])
          .exclude(".hamd-announcement-slider")
          .analyze();
        expect(
          results.violations,
          `${theme} ${path}: ${results.violations.map((v) => v.id).join(", ")}`,
        ).toEqual([]);
        await context.close();
      }
    }
  });
});
