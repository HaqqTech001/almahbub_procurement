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

test.describe("authority navigation and public announcements", () => {
  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page);
  });

  test("signed-out International landing remains public and reachable", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(90_000);
    await page.goto(INTERNATIONAL);
    await expect(page).toHaveURL(/\/businesses\/almahbub-international\/?$/);
    await expect(
      page.locator("main").getByRole("heading", { name: "Almahbub International" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /page not found/i })).toHaveCount(0);
    await expect(page.locator(".hamd-client-shell")).toHaveCount(0);
  });

  test("IE International brand links open the public profile without a loop", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(90_000);
    await page.goto(IE);
    await expect(page.locator(".hamd-aie-portal")).toBeVisible({ timeout: 30_000 });
    const footerLink = page
      .locator("footer.hamd-aie-portal__footer")
      .getByRole("link", { name: "Almahbub International" });
    await expect(footerLink).toHaveAttribute("href", INTERNATIONAL);
    await footerLink.click();
    await expect(page).toHaveURL(/\/businesses\/almahbub-international\/?$/);
    await expect(page).not.toHaveURL(/\/login/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(IE);
    await expect(page.locator(".hamd-aie-portal")).toBeVisible({ timeout: 30_000 });
    const menu = page.getByRole("button", { name: /open navigation/i });
    await expect(menu).toBeVisible();
    await menu.click();
    const drawerLink = page
      .getByRole("dialog")
      .getByRole("link", { name: "Almahbub International" });
    await expect(drawerLink).toHaveAttribute("href", INTERNATIONAL);
  });

  test("Rowdotul HAMD'26 remains on the public slider", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(60_000);
    await page.goto("/");
    const slider = page.locator(".hamd-announcement-slider");
    await expect(slider).toBeVisible({ timeout: 45_000 });
    await expect(slider.getByText(
      /Alhamdulillah|Rowdotul HAMD'26|A beautiful union|Two hearts|With joy|A new chapter|May Allah bless/i,
    ).first()).toBeVisible();
  });

  test("IE portal stays unjammed on required viewports", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "controlled viewports");
    test.setTimeout(180_000);
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(IE);
      await expect(page.locator(".hamd-aie-portal")).toBeVisible({ timeout: 30_000 });
      expect(await overflowPx(page), `overflow ${viewport.width}`).toBeLessThanOrEqual(1);
    }
  });

  test("axe on International landing and IE portal", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const path of [INTERNATIONAL, IE] as const) {
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
