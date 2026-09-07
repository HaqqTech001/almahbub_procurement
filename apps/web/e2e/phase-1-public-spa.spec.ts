import { expect, test, type Page } from "@playwright/test";

async function dismissOverlays(page: Page) {
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
    window.localStorage.setItem("hamd.web.cookie-consent", "essential");
  });
}

async function openPublicNav(page: Page) {
  const header = page.locator("header.hamd-header");
  await expect(header).toBeVisible({ timeout: 30_000 });
  const menu = header.getByRole("button", { name: /open menu/i });
  if (await menu.isVisible()) {
    await menu.click({ force: true });
    return page.locator(".hamd-header__drawer.is-open");
  }
  return header;
}

test.describe("Phase 1 public SPA navigation", () => {
  test.setTimeout(90_000);

  test("internal navbar links keep the document instance", async ({ page }) => {
    await dismissOverlays(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("header.hamd-header")).toBeVisible({ timeout: 30_000 });

    await page.evaluate(() => {
      (window as Window & { __spaMarker?: boolean }).__spaMarker = true;
    });

    const nav = await openPublicNav(page);
    await nav.getByRole("link", { name: "Products" }).first().click();
    await expect(page).toHaveURL(/\/products/);
    expect(
      await page.evaluate(
        () => (window as Window & { __spaMarker?: boolean }).__spaMarker === true,
      ),
    ).toBe(true);
    await expect(page.locator("main#main-content, main")).toBeVisible();
    await expect(page.getByText(/loading page/i)).toHaveCount(0);

    await page.evaluate(() => {
      (window as Window & { __spaMarker?: boolean }).__spaMarker = true;
    });
    const nav2 = await openPublicNav(page);
    await nav2.getByRole("link", { name: "About" }).first().click();
    await expect(page).toHaveURL(/\/about/);
    expect(
      await page.evaluate(
        () => (window as Window & { __spaMarker?: boolean }).__spaMarker === true,
      ),
    ).toBe(true);

    const nav3 = await openPublicNav(page);
    await nav3.getByRole("link", { name: "Contact" }).first().click();
    await expect(page).toHaveURL(/\/contact/);
    expect(
      await page.evaluate(
        () => (window as Window & { __spaMarker?: boolean }).__spaMarker === true,
      ),
    ).toBe(true);
  });

  test("authentication routes remain reachable without reload loops", async ({ page }) => {
    await dismissOverlays(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      (window as Window & { __spaMarker?: boolean }).__spaMarker = true;
    });
    const nav = await openPublicNav(page);
    await nav.getByRole("link", { name: "Sign In" }).first().click();
    await expect(page).toHaveURL(/\/login/);
    expect(
      await page.evaluate(
        () => (window as Window & { __spaMarker?: boolean }).__spaMarker === true,
      ),
    ).toBe(true);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
