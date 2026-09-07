import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PUBLIC_PATHS = ["/", "/products", "/faq", "/contact", "/about", "/group"];

test.describe("public website regression", () => {
  for (const path of PUBLIC_PATHS) {
    test(`loads ${path}`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator("body")).toBeVisible();
    });
  }

  test("homepage has skip link and main landmark", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: /skip to/i });
    await expect(skip).toHaveCount(1);
    await expect(page.locator("main#main-content, main")).toBeVisible();
  });

  test("robots and sitemap are static text/xml", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    const robotsBody = await robots.text();
    expect(robotsBody).toContain("Sitemap:");
    expect(robotsBody.toLowerCase()).not.toContain("<!doctype html");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const sitemapBody = await sitemap.text();
    expect(sitemapBody).toContain("<urlset");
    expect(sitemapBody).toContain("/announcements");
  });

  test("homepage axe WCAG AA", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("reduced motion preference is respected", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const reduced = await page.evaluate(() =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    expect(reduced).toBe(true);
  });
});
