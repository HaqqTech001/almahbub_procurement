import { expect, test } from "@playwright/test";
import { DEFAULT_WEDDING_CAMPAIGN } from "@hamd/constants";

for (const width of [320, 360, 375, 390, 768, 1280]) {
  test(`wedding invitation and re-entry fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/wedding/campaign")) return route.fulfill({ json: { data: {
        ...DEFAULT_WEDDING_CAMPAIGN, modalEnabled: true,
        modalStartsAt: "2020-01-01T00:00:00Z", modalEndsAt: "2030-01-01T00:00:00Z",
      } } });
      if (path.includes("/auth/")) return route.fulfill({ status: 401, json: { error: { message: "Sign in required" } } });
      return route.fulfill({ json: { data: [], items: [] } });
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const dialog = page.locator("dialog.hamd-wedding-modal");
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(dialog.getByText("26 September 2026", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "View Wedding" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Continue browsing", exact: true })).toBeVisible();
    expect(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    const entry = page.getByRole("link", { name: /Rowdotul HAMD/ });
    await expect(entry).toBeVisible();
    expect(await entry.evaluate((node) => {
      const box = node.getBoundingClientRect();
      return box.left >= 0 && box.right <= innerWidth && box.bottom <= innerHeight;
    })).toBe(true);
    expect(await entry.locator("span").evaluate((node) => getComputedStyle(node).animationName)).toBe("none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await entry.click();
    await expect(page).toHaveURL(/\/rowdotul-hamd-26$/);
    await expect(page.locator(".hamd-wedding-reentry")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Rowdotul HAMD'26", exact: true })).toBeVisible();
  });
}
