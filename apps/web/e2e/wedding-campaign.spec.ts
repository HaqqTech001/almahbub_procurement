import { expect, test } from "@playwright/test";

test.describe("Rowdotul HAMD'26 wedding mini-site", () => {
  test("public invitation landing is reachable without auth", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    await page.goto("/rowdotul-hamd-26", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Rowdotul HAMD'26/i }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: /Join Live/i }).first()).toBeVisible();
  });

  test("join live signed out sends the visitor to login with returnTo", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    await page.goto("/rowdotul-hamd-26/live", { waitUntil: "domcontentloaded" });
    const join = page.getByRole("link", { name: /Sign in to Join Live/i });
    await expect(page.getByRole("link", { name: /Sign in to Join Live/i })).toBeVisible({ timeout: 30_000 });
    await expect(join).toHaveAttribute("href", /returnTo=.*rowdotul-hamd-26%2Flive/);
    await expect(page.locator("header.hamd-header")).toHaveCount(0);
    await expect(page.getByTestId("wedding-live-portal")).toBeVisible();
  });

  test("live portal stays chrome-free on mobile with messages access", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "mobile");
    await page.goto("/rowdotul-hamd-26/live", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("wedding-live-portal")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("header.hamd-header")).toHaveCount(0);
    await expect(page.locator("footer.hamd-footer")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Messages/i })).toBeVisible();
  });
});
