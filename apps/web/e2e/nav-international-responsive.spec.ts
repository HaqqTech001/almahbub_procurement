import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const IE = "/businesses/almahbub-integrated-export";
const INTERNATIONAL = "/businesses/almahbub-international";
const VIEWPORTS = [
  { width: 320, height: 800 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 768, height: 900 },
  { width: 1024, height: 900 },
  { width: 1280, height: 900 },
  { width: 1440, height: 900 },
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

test.describe("navigation / International media / IE responsive cleanup", () => {
  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page);
  });

  test("Group page Almahbub International button reaches the existing profile route", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(90_000);
    await page.goto("/group");
    await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
    const cta = page.locator(".hamd-page-hero a[href='/businesses/almahbub-international']");
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/businesses\/almahbub-international\/?$/);
    await expect(page.locator("main").getByRole("heading", { name: "Almahbub International" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /page not found/i })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /business not found/i })).toHaveCount(0);
    await page.reload();
    await expect(page.locator("main").getByRole("heading", { name: "Almahbub International" })).toBeVisible();
  });

  test("International category media appears with unique canonical URLs", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(90_000);
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
    const deferred = page.locator("[data-testid='deferred-below-fold']");
    if (await deferred.count()) {
      await deferred.scrollIntoViewIfNeeded();
    }
    const categoryImages = page.locator(".hamd-categories__card img");
    await expect(categoryImages.first()).toBeVisible({ timeout: 30_000 });
    await expect(categoryImages).toHaveCount(5);
    const srcs = await categoryImages.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLImageElement).getAttribute("src") ?? ""),
    );
    expect(new Set(srcs).size).toBe(5);
    for (const src of srcs) {
      expect(src).toMatch(/^\/media\/international\/category-.+\.jpg$/);
      expect(src).not.toMatch(/\/media\/ie\//);
    }
    const alts = await categoryImages.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLImageElement).getAttribute("alt") ?? ""),
    );
    expect(alts.every((alt) => alt.trim().length > 8)).toBe(true);

    await page.goto("/products");
    await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
    const emptyCards = page.locator(".hamd-catalog-category-card__image");
    if ((await emptyCards.count()) > 0) {
      const productSrcs = await emptyCards.evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLImageElement).getAttribute("src") ?? ""),
      );
      expect(productSrcs.every((src) => src.startsWith("/media/international/"))).toBe(true);
      expect(productSrcs.some((src) => src.includes("/media/ie/"))).toBe(false);
    }
  });

  test("authenticated navigation exposes Integrated Export", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(90_000);
    await page.goto("/__e2e__/workspace-shell");
    await expect(page.locator(".hamd-client-shell")).toBeVisible({ timeout: 30_000 });
    const workspaceLink = page
      .locator(".hamd-client-shell__sidebar")
      .getByRole("link", { name: "Almahbub Integrated Export" });
    await expect(workspaceLink).toBeVisible();
    await expect(workspaceLink).toHaveAttribute("href", IE);

    await page.goto("/__e2e__/public-header-auth");
    await expect(page.locator("header.hamd-header")).toBeVisible({ timeout: 30_000 });
    const headerLink = page
      .locator("header.hamd-header")
      .getByRole("link", { name: "Almahbub Integrated Export" });
    await expect(headerLink).toBeVisible();
    await expect(headerLink).toHaveAttribute("href", IE);
  });

  test("IE navbar stays unjammed across required viewports in light and dark", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "controlled viewports");
    test.setTimeout(240_000);

    for (const theme of ["light", "dark"] as const) {
      await page.addInitScript((value) => {
        window.localStorage.setItem("hamd.web.theme", value);
      }, theme);
      for (const viewport of VIEWPORTS) {
        await page.setViewportSize(viewport);
        await page.goto(IE);
        await expect(page.locator(".hamd-aie-portal")).toBeVisible({ timeout: 30_000 });
        expect(await overflowPx(page), `${theme} overflow ${viewport.width}`).toBeLessThanOrEqual(1);

        const announcements = page.getByRole("region", { name: /site announcements?/i });
        await expect(announcements).toHaveCount(1);
        await expect(announcements).toBeVisible();

        const header = page.locator(".hamd-aie-portal__header");
        const bannerBox = await page.locator(".hamd-announcement-slider").boundingBox();
        const headerBox = await header.boundingBox();
        expect(bannerBox && headerBox && headerBox.y >= bannerBox.y).toBeTruthy();

        if (viewport.width < 960) {
          const menu = page.getByRole("button", { name: /open navigation/i });
          await expect(menu).toBeVisible();
          await expect(menu).not.toHaveText(/menu|close/i);
          await expect(page.locator(".hamd-aie-portal__nav")).toBeHidden();
        } else {
          await expect(page.getByRole("navigation", { name: "Integrated Export" })).toBeVisible();
          await expect(
            page.locator(".hamd-aie-portal__header").getByRole("link", { name: /^Request a Quote$/i }),
          ).toBeVisible();
        }
      }
    }
  });

  test("axe WCAG AA on International products empty categories and Group", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const path of ["/group", INTERNATIONAL, "/products", IE] as const) {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .exclude(".hamd-announcement-slider")
        .analyze();
      expect(
        results.violations,
        `${path}: ${results.violations.map((item) => item.id).join(", ")}`,
      ).toEqual([]);
    }
  });
});
