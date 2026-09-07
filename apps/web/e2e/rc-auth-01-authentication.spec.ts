import { expect, test } from "@playwright/test";

async function dismissOverlays(page: import("@playwright/test").Page) {
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

test.describe("RC-AUTH-01 authentication journeys", () => {
  test.setTimeout(120_000);

  test("auth pages render and protected routes redirect to login", async ({
    page,
    context,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    await context.clearCookies();
    await dismissOverlays(page);

    await page.goto("/app/requests", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();

    for (const path of [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
    ]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".hamd-auth-shell, .hamd-auth-form").first()).toBeVisible({
        timeout: 30_000,
      });
      const overflow = await page.evaluate(
        () =>
          Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    }

    await page.goto("/login");
    const google = page.getByTestId("google-sign-in");
    /* Official GIS button appears only when the client ID + API are configured. */
    if (await google.count()) {
      await expect(google).toBeVisible();
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    const mobileOverflow = await page.evaluate(
      () =>
        Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) -
        document.documentElement.clientWidth,
    );
    expect(mobileOverflow).toBeLessThanOrEqual(1);
  });

  test("login document origin has no path and allows GIS popups", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    const response = await page.goto("/login");
    const origin = await page.evaluate(() => window.location.origin);
    expect(origin).toBe(new URL(page.url()).origin);
    expect(origin.includes("/login")).toBe(false);
    expect(response?.headers()["cross-origin-opener-policy"]).toBe(
      "same-origin-allow-popups",
    );
  });
});
