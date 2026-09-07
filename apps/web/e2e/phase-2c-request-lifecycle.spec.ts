import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const buyerEmail = process.env.HAMD_BUYER_E2E_EMAIL ?? "";
const buyerPassword = process.env.HAMD_BUYER_E2E_PASSWORD ?? "";

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

async function loginBuyer(page: Page) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: /email/i }).fill(buyerEmail);
  await page.locator('input[type="password"][name="password"]').fill(buyerPassword);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/app(\/|$)/, { timeout: 45_000 });
}

test.describe("phase 2c customer request lifecycle", () => {
  test.setTimeout(180_000);

  test("customer request hub cards and detail lifecycle", async ({ page }, testInfo) => {
    test.skip(
      !buyerEmail || !buyerPassword,
      "HAMD_BUYER_E2E_EMAIL / HAMD_BUYER_E2E_PASSWORD required",
    );
    await dismissOverlays(page);
    await loginBuyer(page);

    await page.goto("/app/requests");
    await expect(page.getByRole("heading", { name: /my requests/i })).toBeVisible({
      timeout: 45_000,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator(".hamd-request-hub__cards")).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    const openRequest = page.getByRole("button", { name: /view request/i }).first();
    if (await openRequest.count()) {
      await openRequest.click();
      await expect(page).toHaveURL(/\/app\/requests\/[^/]+/);
      await expect(page.getByText(/my request/i).first()).toBeVisible();
      await expect(page.locator(".hamd-request-lifecycle")).toBeVisible();
      await expect(page.getByRole("heading", { name: /^quotations$/i })).toBeVisible();
      await expect(page.getByText(/not available yet/i).first()).toBeVisible();
      await expect(page.getByRole("button", { name: /approve for sourcing/i })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /approve quote/i })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: /operational next actions/i })).toHaveCount(0);
    }

    await page.goto("/app/notifications");
    await expect(page.getByRole("heading", { name: /notification/i }).first()).toBeVisible({
      timeout: 30_000,
    });

    if (testInfo.project.name === "chromium-desktop") {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto("/app/requests");
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(accessibility.violations).toEqual([]);
    }
  });

  test("unauthenticated request routes preserve returnTo", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    await context.clearCookies();
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
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
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.goto("/app/requests/demo-id", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login\?returnTo=/, { timeout: 30_000 });
    expect(page.url()).toContain(encodeURIComponent("/app/requests/demo-id"));
  });
});
