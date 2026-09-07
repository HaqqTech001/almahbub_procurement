import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = path.join(__dirname, "evidence", "rc-polish-03");

const WIDTHS = [390, 768, 1280, 1920] as const;

async function assertNoOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(doc.scrollWidth, document.body.scrollWidth) - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

async function dismissGuidanceChrome(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
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
    window.sessionStorage.setItem(
      "hamd.session.wedding-modal-dismissed:founder-wedding-september-2026",
      "1",
    );
  });
}

async function dismissWeddingInvitation(page: import("@playwright/test").Page) {
  const closeInvite = page.getByRole("button", { name: /close invitation/i });
  if (await closeInvite.isVisible({ timeout: 1500 }).catch(() => false)) {
    await closeInvite.click();
  }
}

test.describe("RC-POLISH-03 workspace shell", () => {
  test("public navbar IA at key widths", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop project only");
    await context.clearCookies();
    await dismissGuidanceChrome(page);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await page.evaluate(() => {
        window.localStorage.removeItem("hamd.web.auth.sessionHint");
      });
      await page.reload();
      const header = page.locator("header.hamd-header");
      await expect(header).toBeVisible({ timeout: 30_000 });
      await expect(header.getByRole("link", { name: "Almahbub International" })).toBeVisible();
      if (width >= 960) {
        await expect(header.getByRole("link", { name: "Home" }).first()).toBeVisible();
        await expect(header.getByRole("link", { name: "Services" }).first()).toBeVisible();
        await expect(header.getByRole("link", { name: "Products" }).first()).toBeVisible();
        await expect(header.getByRole("link", { name: "Sign In" })).toBeVisible();
        await expect(header.getByRole("link", { name: "Sign Up" })).toBeVisible();
        await expect(header.getByRole("link", { name: "Request Procurement" })).toHaveCount(0);
        await expect(header.locator(".hamd-header__lang")).toHaveCount(0);
      } else {
        await page
          .locator("header.hamd-header")
          .getByRole("button", { name: /open menu/i })
          .click({ force: true });
        const drawer = page.locator("header.hamd-header .hamd-header__drawer.is-open");
        await expect(drawer.getByRole("link", { name: "Sign In" })).toBeVisible();
        await page.keyboard.press("Escape");
      }
      await assertNoOverflow(page);
      await page.screenshot({
        path: path.join(EVIDENCE, `public-${width}.png`),
        fullPage: false,
      });
    }
  });

  test("public mobile drawer", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "mobile project only");
    await context.clearCookies();
    await dismissGuidanceChrome(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.removeItem("hamd.web.auth.sessionHint");
    });
    await page.reload();
    await expect(page.locator("header.hamd-header")).toBeVisible({ timeout: 30_000 });
    await page
      .locator("header.hamd-header")
      .getByRole("button", { name: /open menu/i })
      .click({ force: true });
    const drawer = page.locator("header.hamd-header .hamd-header__drawer.is-open");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Sign In" })).toBeVisible();
    await assertNoOverflow(page);
    await page.screenshot({
      path: path.join(EVIDENCE, "public-mobile-drawer-390.png"),
      fullPage: false,
    });
  });

  test("login preserves returnTo and does not land on unauthorized", async ({ page }) => {
    await page.goto("/app/requests");
    await page.waitForURL(/\/login/, { timeout: 30_000 });
    expect(page.url()).toMatch(/returnTo=%2Fapp%2Frequests/);
    expect(page.url()).not.toMatch(/unauthorized/i);
  });

  test("authenticated workspace shell chrome", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop project only");
    await dismissGuidanceChrome(page);

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/__e2e__/workspace-shell");
      await expect(page.locator(".hamd-client-shell")).toBeVisible({ timeout: 30_000 });
      await expect(page.locator(".hamd-workspace-home__header h1")).toBeVisible();
      await expect(page.getByRole("link", { name: "Request Procurement" })).toHaveCount(0);
      await expect(page.locator(".hamd-header__lang")).toHaveCount(0);
      if (width >= 1024) {
        await expect(
          page.locator(".hamd-client-shell__sidebar").getByRole("navigation", { name: "Primary" }),
        ).toBeVisible();
      }
      await assertNoOverflow(page);
      await page.screenshot({
        path: path.join(EVIDENCE, `workspace-${width}.png`),
        fullPage: false,
      });
    }

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/__e2e__/workspace-shell");
    await expect(page.locator(".hamd-client-shell")).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /ada okoro/i }).click();
    const menu = page.getByRole("menu", { name: /account/i });
    await expect(menu.getByRole("menuitem", { name: /profile/i })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /account settings/i })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /sign out/i })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: /requests/i })).toHaveCount(0);
    await page.screenshot({
      path: path.join(EVIDENCE, "account-menu-1280.png"),
      fullPage: false,
    });
    await page.keyboard.press("Escape");

    await expect(page.locator(".hamd-campaign-banner")).toBeVisible();
    await page.screenshot({
      path: path.join(EVIDENCE, "wedding-celebration-1280.png"),
      fullPage: false,
    });

    await page.getByRole("button", { name: /help \/ guided tour/i }).click();
    await expect(page.getByRole("menu", { name: /product tour/i })).toBeVisible();
    await page.screenshot({
      path: path.join(EVIDENCE, "product-tour-1280.png"),
      fullPage: false,
    });

    await page.screenshot({
      path: path.join(EVIDENCE, "dashboard-1280.png"),
      fullPage: false,
    });

    await page.goto("/__e2e__/workspace-shell?view=requests");
    await expect(
      page.locator("#main-content").getByRole("heading", { name: "Requests" }),
    ).toBeVisible();
    await page.screenshot({
      path: path.join(EVIDENCE, "requests-1280.png"),
      fullPage: false,
    });
  });

  test("authenticated mobile drawer", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "mobile project only");
    await dismissGuidanceChrome(page);
    await page.goto("/__e2e__/workspace-shell");
    await expect(page.locator(".hamd-client-shell")).toBeVisible({ timeout: 30_000 });
    await dismissWeddingInvitation(page);
    const tourSkip = page.getByRole("button", { name: /don't show again|skip/i });
    if (await tourSkip.first().isVisible({ timeout: 1500 }).catch(() => false)) {
      await page.getByRole("button", { name: /don't show again/i }).click();
    }

    for (const viewport of [
      { width: 375, height: 812 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
    ]) {
      await page.setViewportSize(viewport);
      const topbar = page.locator(".hamd-client-shell__topbar");
      const menu = topbar.locator(".hamd-client-shell__menu-btn");
      await expect(menu).toBeVisible();
      await expect(topbar.locator(".hamd-client-shell__topbar-actions .hamd-client-shell__menu-btn")).toHaveCount(0);
      await expect(topbar.locator(".hamd-client-shell__brand--mobile")).toHaveCount(0);
      await expect(page.locator(".hamd-client-shell__sidebar")).toBeHidden();
      await menu.click({ force: true });
      const drawer = page.locator(".hamd-client-shell__drawer.is-open");
      await expect(drawer).toBeVisible();
      await expect(drawer.locator(".hamd-client-shell__brand-logo")).toBeVisible();
      await expect(drawer.getByRole("link", { name: /almahbub international/i })).toBeVisible();
      await expect(drawer.getByRole("link", { name: "Dashboard" })).toBeVisible();
      await expect(drawer.getByRole("link", { name: "Requests" })).toBeVisible();
      await assertNoOverflow(page);
      await page.screenshot({
        path: path.join(EVIDENCE, `workspace-mobile-drawer-${viewport.width}.png`),
        fullPage: false,
      });
      await page.keyboard.press("Escape");
      await expect(drawer).toBeHidden();
    }

    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    await page.locator(".hamd-client-shell__menu-btn").click({ force: true });
    const darkDrawer = page.locator(".hamd-client-shell__drawer.is-open");
    await expect(darkDrawer).toBeVisible();
    await expect(darkDrawer.locator(".hamd-client-shell__brand-logo")).toBeVisible();
    await assertNoOverflow(page);
    await page.keyboard.press("Escape");
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));

    for (const width of [1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator(".hamd-client-shell__menu-btn")).toBeHidden();
      await expect(
        page.locator(".hamd-client-shell__sidebar").getByRole("navigation", { name: "Primary" }),
      ).toBeVisible();
      await expect(page.locator(".hamd-client-shell__sidebar .hamd-client-shell__brand-logo")).toBeVisible();
    }
  });
});
