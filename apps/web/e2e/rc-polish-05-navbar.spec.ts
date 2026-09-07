import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = path.join(__dirname, "evidence", "rc-polish-05");

const WIDTHS = [390, 430, 768, 1024, 1280, 1440, 1920] as const;

async function assertNoOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(doc.scrollWidth, document.body.scrollWidth) - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

async function dismissOverlays(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "hamd.web.guidance.preference",
      JSON.stringify({
        mode: "guided",
        neverAutoStart: true,
        welcomeCompletedAt: "2026-01-01T00:00:00.000Z",
        locale: "en",
        suppressedTourKeys: [],
      }),
    );
    window.localStorage.setItem("hamd.web.cookie-consent", "essential");
  });
}

test.describe("RC-POLISH-05 public navbar IA", () => {
  test.setTimeout(90_000);

  test("desktop public navbar architecture", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop project only");
    await context.clearCookies();
    await dismissOverlays(page);

    for (const width of [1280, 1440, 1920] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.evaluate(() => {
        window.localStorage.removeItem("hamd.web.auth.sessionHint");
      });
      await page.reload({ waitUntil: "networkidle" });
      const header = page.locator("header.hamd-header");
      await expect(header).toBeVisible({ timeout: 60_000 });
      await expect(header.getByRole("link", { name: "Almahbub International" })).toBeVisible();
      for (const label of ["Home", "Products", "Services", "Industries", "About", "Contact"]) {
        await expect(header.getByRole("link", { name: label }).first()).toBeVisible();
      }
      await expect(header.getByRole("button", { name: "Search" })).toBeVisible();
      await expect(header.getByRole("switch", { name: /theme/i })).toBeVisible();
      await expect(header.getByRole("button", { name: /^Help/i })).toBeVisible();
      await expect(header.getByRole("link", { name: "Sign In" })).toBeVisible();
      await expect(header.getByRole("link", { name: "Sign Up" })).toBeVisible();
      await expect(header.getByRole("link", { name: "Request Procurement" })).toHaveCount(0);
      await expect(header.locator(".hamd-header__lang")).toHaveCount(0);
      await expect(page.locator(".hamd-product-tour-control:not(.hamd-product-tour-control--inline)")).toHaveCount(0);
      await assertNoOverflow(page);
      await page.screenshot({
        path: path.join(EVIDENCE, `public-navbar-${width}.png`),
        fullPage: false,
      });
    }
  });

  test("mobile public navbar + drawer", async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile" && testInfo.project.name !== "chromium-desktop",
      "chromium only",
    );
    await context.clearCookies();
    await dismissOverlays(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.removeItem("hamd.web.auth.sessionHint");
    });
    await page.reload();

    const header = page.locator("header.hamd-header");
    await expect(header).toBeVisible({ timeout: 30_000 });
    await expect(header.getByRole("button", { name: /open menu/i })).toBeVisible();
    await expect(header.getByRole("button", { name: "Search" })).toBeVisible();
    await expect(header.getByRole("switch", { name: /theme/i })).toBeVisible();
    await expect(header.getByRole("link", { name: "Sign In" })).toBeHidden();
    await assertNoOverflow(page);
    await page.screenshot({
      path: path.join(EVIDENCE, "public-navbar-390.png"),
      fullPage: false,
    });

    await header.getByRole("button", { name: /open menu/i }).click({ force: true });
    const drawer = page.locator(".hamd-header__drawer.is-open");
    await expect(drawer).toBeVisible();
    for (const label of ["Home", "Products", "Services", "Industries", "About", "Contact"]) {
      await expect(drawer.getByRole("link", { name: label })).toBeVisible();
    }
    await expect(drawer.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Sign Up" })).toBeVisible();
    await expect(drawer.getByRole("button", { name: /^Help/i })).toHaveCount(0);
    await expect(drawer.getByRole("switch", { name: /theme/i })).toHaveCount(0);
    await assertNoOverflow(page);
    await page.screenshot({
      path: path.join(EVIDENCE, "public-drawer-390.png"),
      fullPage: false,
    });
    await page.keyboard.press("Escape");
    await expect(page.locator(".hamd-header__drawer.is-open")).toHaveCount(0);
  });

  test("theme control light and dark", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop project only");
    await context.clearCookies();
    await dismissOverlays(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await expect(page.locator("header.hamd-header")).toBeVisible({ timeout: 30_000 });

    const theme = page.locator("header.hamd-header").getByRole("switch", { name: /theme/i });
    await theme.scrollIntoViewIfNeeded();

    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
    });
    const lightMetrics = await theme.evaluate((el) => {
      const track = el.querySelector(".hamd-header__theme-track") as HTMLElement;
      const icons = Array.from(el.querySelectorAll(".hamd-header__theme-icon")) as HTMLElement[];
      const tr = track.getBoundingClientRect();
      return {
        trackW: tr.width,
        trackH: tr.height,
        iconsInside: icons.every((icon) => {
          const r = icon.getBoundingClientRect();
          return r.left >= tr.left - 0.5 && r.right <= tr.right + 0.5 && r.top >= tr.top - 0.5 && r.bottom <= tr.bottom + 0.5;
        }),
      };
    });
    expect(lightMetrics.iconsInside).toBe(true);
    await theme.screenshot({ path: path.join(EVIDENCE, "theme-light.png") });

    await theme.click();
    await page.waitForTimeout(250);
    const darkMetrics = await theme.evaluate((el) => {
      const track = el.querySelector(".hamd-header__theme-track") as HTMLElement;
      const icons = Array.from(el.querySelectorAll(".hamd-header__theme-icon")) as HTMLElement[];
      const tr = track.getBoundingClientRect();
      return {
        iconsInside: icons.every((icon) => {
          const r = icon.getBoundingClientRect();
          return r.left >= tr.left - 0.5 && r.right <= tr.right + 0.5 && r.top >= tr.top - 0.5 && r.bottom <= tr.bottom + 0.5;
        }),
      };
    });
    expect(darkMetrics.iconsInside).toBe(true);
    await theme.screenshot({ path: path.join(EVIDENCE, "theme-dark.png") });
  });

  test("help / product tour control in utilities", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop project only");
    await context.clearCookies();
    await dismissOverlays(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const header = page.locator("header.hamd-header");
    await expect(header).toBeVisible({ timeout: 30_000 });
    const help = header.getByRole("button", { name: /^Help/i });
    await help.click();
    await expect(page.getByRole("menu", { name: /product tour/i })).toBeVisible();
    await page.screenshot({
      path: path.join(EVIDENCE, "help-tour-control-1280.png"),
      fullPage: false,
    });
    await page.keyboard.press("Escape");
  });

  test("authenticated workspace header + sidebar", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop project only");
    await dismissOverlays(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/__e2e__/workspace-shell");
    await expect(page.locator(".hamd-client-shell")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: "Request Procurement" })).toHaveCount(0);
    await expect(page.locator(".hamd-header__lang")).toHaveCount(0);
    await expect(
      page.locator(".hamd-client-shell__sidebar").getByRole("navigation", { name: "Primary" }),
    ).toBeVisible();
    await assertNoOverflow(page);
    await page.screenshot({
      path: path.join(EVIDENCE, "auth-header-1280.png"),
      fullPage: false,
    });
    await page.locator(".hamd-client-shell__sidebar").screenshot({
      path: path.join(EVIDENCE, "auth-sidebar-1280.png"),
    });
  });

  test("authenticated mobile drawer", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-mobile" && testInfo.project.name !== "chromium-desktop",
      "chromium only",
    );
    await dismissOverlays(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/__e2e__/workspace-shell");
    await expect(page.locator(".hamd-client-shell")).toBeVisible({ timeout: 30_000 });
    const openNav = page.getByRole("button", { name: /open (menu|navigation)/i });
    if (await openNav.count()) {
      await expect(page.locator(".hamd-client-shell__topbar-actions .hamd-client-shell__menu-btn")).toHaveCount(0);
      await openNav.first().click({ force: true });
      const drawer = page.getByRole("dialog", { name: /workspace navigation/i });
      await expect(drawer.locator(".hamd-client-shell__brand-logo")).toBeVisible();
    }
    await assertNoOverflow(page);
    await page.screenshot({
      path: path.join(EVIDENCE, "auth-mobile-drawer-390.png"),
      fullPage: false,
    });
  });

  test("responsive widths no overflow", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop project only");
    await context.clearCookies();
    await dismissOverlays(page);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.locator("header.hamd-header")).toBeVisible({ timeout: 30_000 });
      await assertNoOverflow(page);
    }
  });
});
