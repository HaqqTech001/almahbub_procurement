import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
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
});

async function expectIntegratedExportPortal(page: import("@playwright/test").Page) {
  await expect(page).toHaveURL(/\/businesses\/almahbub-integrated-export\/?$/);
  await expect(page.locator(".hamd-aie-portal")).toBeVisible({ timeout: 30_000 });
  await expect(
    page.locator("main").getByRole("heading", { name: "Almahbub Integrated Export Ltd." }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: /integrated export/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /request a quote/i }).first()).toBeVisible();
  await expect(page.locator("footer.hamd-footer")).toHaveCount(0);
  await expect(page.locator(".hamd-aie-portal__footer")).toBeVisible();
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeLessThan(80);
}

test.describe("Integrated Export portal navigation", () => {
  test("homepage sister CTA opens the dedicated portal, not the footer", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();

    await page.locator("[data-testid='deferred-below-fold']").scrollIntoViewIfNeeded();
    const sisterSection = page.locator("#integrated-export-discovery");
    await expect(sisterSection).toBeVisible({ timeout: 30_000 });

    const cta = sisterSection.getByTestId("aie-portal-entry-cta");
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toHaveAttribute("href", "/businesses/almahbub-integrated-export");
    await cta.click();

    await expectIntegratedExportPortal(page);
  });

  test("homepage name link opens the dedicated portal", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/");
    await page.locator("[data-testid='deferred-below-fold']").scrollIntoViewIfNeeded();
    const sisterSection = page.locator("#integrated-export-discovery");
    await expect(sisterSection).toBeVisible({ timeout: 30_000 });
    const nameLink = sisterSection.getByTestId("aie-portal-entry");
    await nameLink.scrollIntoViewIfNeeded();
    await expect(nameLink).toHaveAttribute("href", "/businesses/almahbub-integrated-export");
    await nameLink.click();
    await expectIntegratedExportPortal(page);
  });

  test("footer Integrated Export link opens the dedicated portal", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
    const footer = page.getByTestId("global-footer");
    await footer.scrollIntoViewIfNeeded();
    const footerLink = page.getByTestId("aie-portal-entry-footer");
    if (!(await footerLink.isVisible())) {
      await footer.locator("summary").filter({ hasText: /^Businesses$/i }).click();
    }
    await expect(footerLink).toBeVisible();
    await expect(footerLink).toHaveAttribute("href", "/businesses/almahbub-integrated-export");
    await footerLink.click();
    await expectIntegratedExportPortal(page);
  });

  test("group page Integrated Export CTA opens the portal", async ({ page }) => {
    await page.goto("/group");
    await expect(page.locator("main")).toBeVisible();
    const cta = page.getByTestId("aie-portal-entry-cta").first();
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toHaveAttribute("href", "/businesses/almahbub-integrated-export");
    await cta.click();
    await expectIntegratedExportPortal(page);
  });

  test("International profile footer opens the dedicated portal", async ({ page }) => {
    await page.goto("/businesses/almahbub-international");
    await expect(page.locator("main")).toBeVisible();
    const footerLink = page.getByTestId("aie-portal-entry-footer");
    await footerLink.scrollIntoViewIfNeeded();
    await expect(footerLink).toHaveAttribute("href", "/businesses/almahbub-integrated-export");
    await footerLink.click();
    await expectIntegratedExportPortal(page);
  });

  test("Integrated Export portal footer keeps the dedicated chrome", async ({ page }) => {
    await page.goto("/businesses/almahbub-integrated-export");
    await expectIntegratedExportPortal(page);
    const footerLink = page.getByTestId("aie-portal-entry-footer");
    await footerLink.scrollIntoViewIfNeeded();
    await expect(footerLink).toHaveAttribute(
      "href",
      "/businesses/almahbub-integrated-export",
    );
    await footerLink.click();
    await expectIntegratedExportPortal(page);
  });

  test("IE foundation routes resolve without International footer", async ({ page }) => {
    test.setTimeout(90_000);
    const paths = [
      "/businesses/almahbub-integrated-export/commodities",
      "/businesses/almahbub-integrated-export/commodities/sesame",
      "/businesses/almahbub-integrated-export/process",
      "/businesses/almahbub-integrated-export/quality",
      "/businesses/almahbub-integrated-export/markets",
      "/businesses/almahbub-integrated-export/about",
      "/businesses/almahbub-integrated-export/contact",
      "/businesses/almahbub-integrated-export/request",
    ];
    for (const path of paths) {
      await page.goto(path);
      await expect(page.locator(".hamd-aie-portal")).toBeVisible({ timeout: 30_000 });
      await expect(page.locator("footer.hamd-footer")).toHaveCount(0);
      await expect(page.locator("main h1")).toBeVisible();
    }
  });

  test("legacy hash #commodities redirects to commodities route", async ({ page }) => {
    await page.goto("/businesses/almahbub-integrated-export#commodities");
    await expect(page).toHaveURL(
      /\/businesses\/almahbub-integrated-export\/commodities\/?$/,
      { timeout: 20_000 },
    );
    await expect(
      page.getByRole("heading", { name: /no commodities published yet/i }),
    ).toBeVisible();
  });
});
