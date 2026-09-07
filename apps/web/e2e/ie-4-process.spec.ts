import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const IE = "/businesses/almahbub-integrated-export";
const PROCESS = `${IE}/process`;

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

test.describe("IE-4 process page", () => {
  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page);
  });

  test("process stages, images, and CTAs", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(120_000);

    for (const width of [1024, 1280, 1440, 1920] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(PROCESS);
      await expect(page.locator(".hamd-aie-process")).toBeVisible({ timeout: 30_000 });
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: /from enquiry to export coordination/i,
        }),
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: /buyer enquiry/i })).toBeVisible();
      await expect(page.locator(".hamd-aie-process__hero-media img")).toBeVisible();
      expect(await overflowPx(page)).toBeLessThanOrEqual(1);
    }

    await page
      .locator(".hamd-aie-process__section--cta")
      .getByRole("link", { name: /^Request a Quote$/i })
      .click();
    await expect(page).toHaveURL(new RegExp(`${IE}/request/?$`));

    await page.goto(PROCESS);
    await page
      .locator(".hamd-aie-process__section--cta")
      .getByRole("link", { name: /explore commodities/i })
      .click();
    await expect(page).toHaveURL(new RegExp(`${IE}/commodities/?$`));
  });

  test("mobile process layout has no overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "viewport control");
    test.setTimeout(120_000);

    for (const width of [320, 360, 375, 390, 414] as const) {
      await page.setViewportSize({ width, height: 812 });
      await page.goto(PROCESS);
      await expect(page.locator(".hamd-aie-process")).toBeVisible({ timeout: 30_000 });
      expect(await overflowPx(page)).toBeLessThanOrEqual(1);
    }
  });

  test("axe WCAG AA on process page", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(120_000);

    for (const theme of ["light", "dark"] as const) {
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
      await page.goto(PROCESS);
      await expect(page.locator(".hamd-aie-process")).toBeVisible({ timeout: 30_000 });
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .exclude(".hamd-announcement-slider")
        .analyze();
      expect(
        results.violations,
        `${theme}: ${results.violations.map((v) => v.id).join(", ")}`,
      ).toEqual([]);
      await context.close();
    }
  });
});
