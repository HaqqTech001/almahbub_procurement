import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const IE = "/businesses/almahbub-integrated-export";

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

test.describe("IE-2 homepage", () => {
  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page);
  });

  test("desktop homepage sections, CTAs, and overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(120_000);
    const errors = await collectAppConsoleErrors(page);

    for (const width of [1280, 1440] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(IE);
      await expect(page.locator(".hamd-aie-home")).toBeVisible({ timeout: 30_000 });
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Almahbub Integrated Export Ltd.",
        }),
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: /explore our commodities/i })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /no commodities published yet/i }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Sesame Seeds", exact: true })).toHaveCount(0);
      expect(await overflowPx(page)).toBeLessThanOrEqual(1);
      await expect(
        page.getByRole("heading", { name: /from enquiry to export coordination/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /quality guided by specification/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /connecting supply with buyer demand/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /have a sourcing requirement/i }),
      ).toBeVisible();

      const explore = page
        .locator(".hamd-aie-home__hero")
        .getByRole("link", { name: /explore commodities/i });
      await expect(explore).toHaveAttribute("href", `${IE}/commodities`);
      const quote = page
        .locator(".hamd-aie-home__hero")
        .getByRole("link", { name: /request a quote/i });
      await expect(quote).toHaveAttribute("href", `${IE}/request`);

      expect(await overflowPx(page)).toBeLessThanOrEqual(1);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      expect(await overflowPx(page)).toBeLessThanOrEqual(1);
    }

    expect(errors).toEqual([]);
  });

  test("mobile homepage layout, drawer, and announcement", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "viewport control");
    test.setTimeout(120_000);

    for (const width of [375, 390] as const) {
      await page.setViewportSize({ width, height: 812 });
      await page.goto(IE);
      await expect(page.locator(".hamd-aie-home")).toBeVisible({ timeout: 30_000 });
      expect(await overflowPx(page)).toBeLessThanOrEqual(1);

      const announcements = page.getByRole("region", { name: /site announcements?/i });
      await expect(announcements).toHaveCount(1);

      await page.getByRole("button", { name: /open navigation/i }).click();
      await expect(page.locator(".hamd-aie-portal__drawer")).toBeVisible();
      await page.locator(".hamd-aie-portal__drawer-close").click();
      await expect(page.locator(".hamd-aie-portal__drawer")).toBeHidden();
    }
  });

  test("homepage CTA navigation", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(90_000);

    await page.goto(IE);
    await page
      .locator(".hamd-aie-home__hero")
      .getByRole("link", { name: /explore commodities/i })
      .click();
    await expect(page).toHaveURL(new RegExp(`${IE}/commodities/?$`));

    await page.goto(IE);
    await page
      .locator(".hamd-aie-home__section--cta")
      .getByRole("link", { name: /^Request a Quote$/i })
      .click();
    await expect(page).toHaveURL(new RegExp(`${IE}/request/?$`));
  });

  test("axe WCAG AA on IE-2 homepage", async ({ browser }, testInfo) => {
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
      await page.goto(IE);
      await expect(page.locator(".hamd-aie-home")).toBeVisible({ timeout: 30_000 });
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
