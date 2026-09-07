import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const IE = "/businesses/almahbub-integrated-export";
const CONTACT = `${IE}/contact`;
const REQUEST = `${IE}/request`;

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
    if (/Failed to load resource:.*403/i.test(text)) return;
    errors.push(text);
  });
  return errors;
}

test.describe("IE-8 contact and request", () => {
  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page);
  });

  test("contact and request UX, validation, and responsive overflow", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(180_000);
    const errors = await collectAppConsoleErrors(page);

    for (const width of [1024, 1280, 1440, 1920] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(CONTACT);
      await expect(page.locator(".hamd-aie-contact")).toBeVisible({ timeout: 30_000 });
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: /let's discuss your export requirement/i,
        }),
      ).toBeVisible();
      await expect(
        page.locator(".hamd-aie-contact__email"),
      ).toHaveText(/almahbubinternational@gmail\.com/i);
      expect(await overflowPx(page)).toBeLessThanOrEqual(1);

      await page.goto(REQUEST);
      await expect(page.locator(".hamd-aie-request")).toBeVisible({ timeout: 30_000 });
      await expect(
        page.getByRole("heading", { level: 1, name: /^request a quote$/i }),
      ).toBeVisible();
      expect(await overflowPx(page)).toBeLessThanOrEqual(1);
    }

    await page.goto(CONTACT);
    await page
      .locator(".hamd-aie-contact__section--cta")
      .getByRole("link", { name: /^Request a Quote$/i })
      .click();
    await expect(page).toHaveURL(new RegExp(`${IE}/request/?$`));

    await page.getByRole("button", { name: /^Submit Enquiry$/i }).click();
    await expect(page.getByText(/enter your company or buyer name/i)).toBeVisible();
    await expect(page.getByText(/request id/i)).toHaveCount(0);

    await page.getByLabel(/company \/ buyer name/i).fill("Acme Trading");
    await page.getByLabel(/business email/i).fill("buyer@example.com");
    await page.getByLabel(/commodity \/ requirement/i).fill("Agro commodity need");
    await page.getByRole("button", { name: /^Submit Enquiry$/i }).click();
    await expect(
      page.getByRole("heading", {
        name: /sign in to submit this enquiry/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /sign in to submit/i }),
    ).toHaveAttribute("href", /login\?returnTo=/);
    await expect(
      page.getByRole("link", { name: /open email with your enquiry/i }),
    ).toHaveAttribute("href", /mailto:almahbubinternational@gmail\.com/);

    await page.goto(`${REQUEST}?commodity=not-a-real-ie-commodity`);
    await expect(page.getByText(/requesting:/i)).toHaveCount(0);

    await page
      .locator(".hamd-aie-request__section--cta")
      .getByRole("link", { name: /^Contact$/i })
      .click();
    await expect(page).toHaveURL(new RegExp(`${IE}/contact/?$`));

    expect(errors).toEqual([]);
  });

  test("mobile contact and request have no overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "viewport control");
    test.setTimeout(120_000);

    for (const width of [320, 360, 375, 390, 414, 768] as const) {
      await page.setViewportSize({ width, height: 812 });
      await page.goto(CONTACT);
      await expect(page.locator(".hamd-aie-contact")).toBeVisible({ timeout: 30_000 });
      expect(await overflowPx(page)).toBeLessThanOrEqual(1);
      await page.goto(REQUEST);
      await expect(page.locator(".hamd-aie-request")).toBeVisible({ timeout: 30_000 });
      expect(await overflowPx(page)).toBeLessThanOrEqual(1);
    }
  });

  test("axe WCAG AA on contact and request", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(180_000);

    for (const theme of ["light", "dark"] as const) {
      for (const path of [CONTACT, REQUEST] as const) {
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
          page.locator(path.endsWith("/contact") ? ".hamd-aie-contact" : ".hamd-aie-request"),
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
