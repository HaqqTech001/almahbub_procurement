import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const IE = "/businesses/almahbub-integrated-export";
const ABOUT = `${IE}/about`;

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

async function collectAppConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/Download the React DevTools/i.test(text)) return;
    if (/favicon/i.test(text)) return;
    if (/Access-Control-Allow-Origin|CORS policy|net::ERR_FAILED/i.test(text)) {
      return;
    }
    if (/\/api\/v1\/announcements/i.test(text)) return;
    errors.push(text);
  });
  return errors;
}

test.describe("IE-7 about page", () => {
  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page);
  });

  test("sections, CTAs, and responsive overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(120_000);
    const errors = await collectAppConsoleErrors(page);

    for (const width of [1024, 1280, 1440, 1920] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(ABOUT);
      await expect(page.locator(".hamd-aie-about")).toBeVisible({ timeout: 30_000 });
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: /a dedicated business for agro commodity trade/i,
        }),
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: /^who we are$/i })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /^part of almahbub group$/i }),
      ).toBeVisible();
      await expect(page.getByText(/50\+\s*countries/i)).toHaveCount(0);
      await expect(page.getByText(/what our clients say/i)).toHaveCount(0);
      expect(await overflowPx(page)).toBeLessThanOrEqual(1);
    }

    await page
      .locator(".hamd-aie-about__section--cta")
      .getByRole("link", { name: /^Request a Quote$/i })
      .click();
    await expect(page).toHaveURL(new RegExp(`${IE}/request/?$`));

    await page.goto(ABOUT);
    await page.getByRole("link", { name: /^Explore Our Process$/i }).click();
    await expect(page).toHaveURL(new RegExp(`${IE}/process/?$`));

    await page.goto(ABOUT);
    await page
      .getByRole("link", { name: /quality & specification alignment/i })
      .click();
    await expect(page).toHaveURL(new RegExp(`${IE}/quality/?$`));

    expect(errors).toEqual([]);
  });

  test("mobile about layout has no overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "viewport control");
    test.setTimeout(120_000);

    for (const width of [320, 360, 375, 390, 414, 768] as const) {
      await page.setViewportSize({ width, height: 812 });
      await page.goto(ABOUT);
      await expect(page.locator(".hamd-aie-about")).toBeVisible({ timeout: 30_000 });
      expect(await overflowPx(page)).toBeLessThanOrEqual(1);
    }
  });

  test("axe WCAG AA on about page", async ({ browser }, testInfo) => {
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
      await page.goto(ABOUT);
      await expect(page.locator(".hamd-aie-about")).toBeVisible({ timeout: 30_000 });
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
