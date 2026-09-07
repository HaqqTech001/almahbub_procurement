import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const IE = "/businesses/almahbub-integrated-export";

const IE_ROUTES = [
  { path: IE, heading: /Almahbub Integrated Export Ltd\./i },
  { path: `${IE}/commodities`, heading: /explore our commodities/i },
  {
    path: `${IE}/commodities/example`,
    heading: /commodity information is being updated/i,
  },
  { path: `${IE}/process`, heading: /from enquiry to export coordination/i },
  { path: `${IE}/quality`, heading: /quality guided by specification/i },
  { path: `${IE}/markets`, heading: /connecting supply with buyer demand/i },
  { path: `${IE}/about`, heading: /a dedicated business for agro commodity trade/i },
  { path: `${IE}/contact`, heading: /let's discuss your export requirement/i },
  { path: `${IE}/request`, heading: /request a quote/i },
] as const;

const HASH_CASES = [
  { hash: "#commodities", expectPath: `${IE}/commodities` },
  { hash: "#bulk-supply", expectPath: `${IE}/commodities` },
  { hash: "#export", expectPath: `${IE}/process` },
  { hash: "#about", expectPath: `${IE}/about` },
  { hash: "#contact", expectPath: `${IE}/contact` },
] as const;

const MOBILE_VIEWPORTS = [
  { width: 320, height: 800 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
] as const;

const DESKTOP_WIDTHS = [768, 1024, 1280, 1440, 1920] as const;

const NAV_ITEMS = [
  { name: /^Home$/i, path: IE },
  { name: /^Commodities$/i, path: `${IE}/commodities` },
  { name: /^Our Process$/i, path: `${IE}/process` },
  { name: /^Quality & Compliance$/i, path: `${IE}/quality` },
  { name: /^Global Markets$/i, path: `${IE}/markets` },
  { name: /^About$/i, path: `${IE}/about` },
  { name: /^Contact$/i, path: `${IE}/contact` },
] as const;

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
    // Preview (4173) ↔ API (4000) CORS is an env wiring issue, not an IE-1 defect.
    if (/Access-Control-Allow-Origin|CORS policy|net::ERR_FAILED/i.test(text)) {
      return;
    }
    if (/\/api\/v1\/announcements/i.test(text)) return;
    errors.push(text);
  });
  return errors;
}

test.describe("IE-1.1 browser acceptance gate", () => {
  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page);
  });

  test("deep links, refresh, and empty commodity slug", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(180_000);
    const errors = await collectAppConsoleErrors(page);

    for (const route of IE_ROUTES) {
      await page.goto(route.path);
      await expect(page.locator(".hamd-aie-portal")).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.locator("footer.hamd-footer")).toHaveCount(0);
      await expect(page.locator(".hamd-aie-portal__footer")).toBeVisible();
      await expect(page.locator("main").getByRole("heading", { level: 1 })).toHaveText(
        route.heading,
      );
      await page.reload();
      await expect(page.locator(".hamd-aie-portal")).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.locator("main").getByRole("heading", { level: 1 })).toHaveText(
        route.heading,
      );
    }

    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("desktop navigation active states", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(IE);
    await expect(page.locator(".hamd-aie-portal")).toBeVisible({ timeout: 30_000 });

    const desktopNav = page.getByRole("navigation", { name: "Integrated Export" });
    for (const item of NAV_ITEMS) {
      await desktopNav.getByRole("link", { name: item.name }).click();
      await expect(page).toHaveURL(new RegExp(`${item.path.replace(/\//g, "\\/")}/?$`));
      await expect(
        desktopNav.getByRole("link", { name: item.name }),
      ).toHaveClass(/is-active/);
    }

    await page.getByRole("link", { name: /^Request a Quote$/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`${IE}/request/?$`));
  });

  test("legacy hash redirects", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(120_000);
    for (const item of HASH_CASES) {
      await page.goto(`${IE}${item.hash}`);
      await expect(page).toHaveURL(new RegExp(`${item.expectPath.replace(/\//g, "\\/")}/?$`), {
        timeout: 20_000,
      });
      await expect(page.locator(".hamd-aie-portal")).toBeVisible();
    }
  });

  test("mobile drawer open/close/nav without overflow", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "controlled viewports");
    test.setTimeout(240_000);

    for (const viewport of MOBILE_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(IE);
      await expect(page.locator(".hamd-aie-portal")).toBeVisible({
        timeout: 30_000,
      });
      expect(await overflowPx(page), `overflow ${viewport.width}`).toBeLessThanOrEqual(
        1,
      );

      const menu = page.getByRole("button", { name: /open navigation/i });
      await expect(menu).toBeVisible();
      await expect(menu).toHaveAttribute("aria-label", "Open navigation");
      await expect(menu).not.toHaveText(/menu|close/i);

      await menu.click();
      const drawer = page.getByRole("dialog", { name: /integrated export menu/i });
      await expect(drawer).toBeVisible();
      await expect(page.locator(".hamd-aie-portal__backdrop")).toBeVisible();
      await expect(page.getByRole("button", { name: /close navigation/i }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: /close navigation/i }).first()).not.toHaveText(
        /menu|close/i,
      );

      const announcements = page.getByRole("region", { name: /site announcements?/i });
      await expect(announcements).toBeVisible();
      const announcementUncovered = await page.evaluate(() => {
        const banner = document.querySelector(".hamd-announcement-slider");
        const backdrop = document.querySelector(".hamd-aie-portal__backdrop");
        if (!banner || !backdrop) return false;
        const bannerBox = banner.getBoundingClientRect();
        const backdropBox = backdrop.getBoundingClientRect();
        return backdropBox.top >= bannerBox.bottom - 1;
      });
      expect(announcementUncovered, `announcement covered at ${viewport.width}`).toBe(true);

      await page.keyboard.press("Escape");
      await expect(drawer).toBeHidden();
      await expect(menu).toBeFocused();

      await menu.click();
      await page.locator(".hamd-aie-portal__drawer-close").click();
      await expect(drawer).toBeHidden();

      await menu.click();
      await page.locator(".hamd-aie-portal__backdrop").click({ force: true });
      await expect(drawer).toBeHidden();

      await menu.click();
      await drawer.getByRole("link", { name: /^Commodities$/i }).click();
      await expect(page).toHaveURL(new RegExp(`${IE}/commodities/?$`));
      await expect(drawer).toBeHidden();
      expect(await overflowPx(page), `overflow after nav ${viewport.width}`).toBeLessThanOrEqual(
        1,
      );
    }
  });

  test("desktop responsive widths have no horizontal overflow", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(180_000);
    for (const width of DESKTOP_WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [IE, `${IE}/commodities`, `${IE}/request`] as const) {
        await page.goto(path);
        await expect(page.locator(".hamd-aie-portal")).toBeVisible({
          timeout: 30_000,
        });
        expect(await overflowPx(page), `overflow ${width} ${path}`).toBeLessThanOrEqual(
          1,
        );
      }
    }
  });

  test("axe WCAG AA light/dark on IE foundation pages", async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(300_000);

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

      for (const route of IE_ROUTES) {
        await page.goto(route.path);
        await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa"])
          .exclude(".hamd-announcement-slider")
          .analyze();
        expect(
          results.violations,
          `${route.path} ${theme}: ${results.violations.map((item) => item.id).join(", ")}`,
        ).toEqual([]);
      }
      await context.close();
    }
  });

  test("global wedding announcement appears once above IE chrome", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(90_000);
    await page.goto(IE);
    await expect(page.locator(".hamd-aie-portal")).toBeVisible({ timeout: 30_000 });

    const announcements = page.getByRole("region", { name: /site announcements?/i });
    await expect(announcements).toHaveCount(1);
    await expect(announcements).toHaveAttribute(
      "data-announcement-id",
      /founder-wedding-september-2026/,
    );
    await expect(announcements).toBeVisible();

    const order = await page.evaluate(() => {
      const banner = document.querySelector(".hamd-announcement-slider");
      const portal = document.querySelector(".hamd-aie-portal");
      if (!banner || !portal) return "missing";
      return banner.compareDocumentPosition(portal) & Node.DOCUMENT_POSITION_FOLLOWING
        ? "banner-then-portal"
        : "portal-then-banner";
    });
    expect(order).toBe("banner-then-portal");

    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole("button", { name: /open navigation/i }).click();
    await expect(page.locator(".hamd-aie-portal__backdrop")).toBeVisible();
    await expect(announcements).toBeVisible();
    const uncovered = await page.evaluate(() => {
      const backdrop = document.querySelector(".hamd-aie-portal__backdrop");
      const banner = document.querySelector(".hamd-announcement-slider");
      if (!backdrop || !banner) return false;
      const bannerBox = banner.getBoundingClientRect();
      const backdropBox = backdrop.getBoundingClientRect();
      return backdropBox.top >= bannerBox.bottom - 1;
    });
    expect(uncovered).toBe(true);
  });

  test("International regression smoke", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(120_000);

    await page.goto("/");
    await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("global-footer")).toBeVisible();

    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 30_000 });

    await page.goto("/app/requests");
    await expect(page).toHaveURL(/\/(login|app\/requests)/);
  });
});
