import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WIDTHS = [320, 360, 375, 390, 414, 480, 768, 1024, 1280, 1440, 1920] as const;
const IE_PATH = "/businesses/almahbub-integrated-export";
const DEAD_HREFS = [
  "/track",
  "/catalog/categories",
  "/catalog#featured-products",
  "/industries/energy",
  "/industries/manufacturing",
  "/industries/construction",
  "/industries/healthcare",
  "/industries/mining",
  "/services/global-procurement",
  "/services/import-export",
  "/services/logistics",
  "/services/warehousing",
  "/procurement-services",
  "/global-sourcing",
  "/help",
  "/knowledge",
  "/case-studies",
  "/supplier-network",
];

const LIVE_PAGES = [
  "/",
  "/about",
  "/products",
  "/services",
  "/industries",
  "/faq",
  "/group",
  "/businesses/almahbub-international",
  IE_PATH,
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

async function expectNoStuckSkeleton(page: Page) {
  await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".hamd-skeleton[aria-busy='true']")).toHaveCount(0);
}

async function expectIntegratedExportPortal(page: Page) {
  await expect(page).toHaveURL(new RegExp(`${IE_PATH}$`));
  await expect(page.locator(".hamd-aie-portal")).toBeVisible();
  await expect(
    page.locator("main").getByRole("heading", { name: "Almahbub Integrated Export Ltd." }),
  ).toBeVisible();
  await expect(page.locator("footer.hamd-footer")).toHaveCount(0);
}

async function footerHrefs(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const footer =
      document.querySelector("footer.hamd-footer") ??
      document.querySelector("footer.hamd-aie-portal__footer") ??
      document.querySelector("footer");
    if (!footer) return [];
    return Array.from(footer.querySelectorAll("a[href]")).map(
      (anchor) => (anchor as HTMLAnchorElement).getAttribute("href") ?? "",
    );
  });
}

test.describe("Phase 6B footer integrity", () => {
  for (const path of LIVE_PAGES) {
    test(`footer hrefs are live on ${path}`, async ({ page }) => {
      await dismissOverlays(page);
      await page.goto(path);
      await expectNoStuckSkeleton(page);
      const footer = page.locator("footer").first();
      await footer.scrollIntoViewIfNeeded();
      const hrefs = await footerHrefs(page);
      expect(hrefs.length, `${path} footer has links`).toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(href, `${path} empty footer href`).toBeTruthy();
        const bare = href.split("#")[0] ?? href;
        expect(DEAD_HREFS, `${path} dead footer href ${href}`).not.toContain(bare);
      }
      const ie = hrefs.find((href) => href.includes("almahbub-integrated-export"));
      if (path !== IE_PATH) {
        expect(ie).toBe(IE_PATH);
      } else {
        expect(ie === IE_PATH || hrefs.includes(IE_PATH)).toBeTruthy();
      }
    });
  }

  test("Integrated Export footer click from International surfaces", async ({ page }) => {
    test.setTimeout(120_000);
    await dismissOverlays(page);
    for (const path of ["/", "/group", "/businesses/almahbub-international", IE_PATH] as const) {
      await page.goto(path);
      await expectNoStuckSkeleton(page);
      const footerLink = page.getByTestId("aie-portal-entry-footer");
      await footerLink.scrollIntoViewIfNeeded();
      if (!(await footerLink.isVisible())) {
        const businesses = page.locator("footer summary").filter({ hasText: /^Businesses$/i });
        if (await businesses.count()) await businesses.click();
      }
      await expect(footerLink).toBeVisible();
      await expect(footerLink).toHaveAttribute("href", IE_PATH);
      await footerLink.click();
      await expectIntegratedExportPortal(page);
    }
  });

  test("SPA footer navigation does not stick on a skeleton", async ({ page }) => {
    await dismissOverlays(page);
    await page.goto("/");
    await expectNoStuckSkeleton(page);
    await page.getByTestId("global-footer").getByRole("link", { name: /^About$/i }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expectNoStuckSkeleton(page);
    await page.getByTestId("global-footer").getByRole("link", { name: /Product Catalogue/i }).click();
    await expect(page).toHaveURL(/\/products/);
    await expectNoStuckSkeleton(page);
  });
});

test.describe("Phase 6B footer responsive + axe", () => {
  for (const width of WIDTHS) {
    test(`footer has no overflow at ${width}px`, async ({ page }) => {
      await dismissOverlays(page);
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
      const footer = page.getByTestId("global-footer");
      await footer.scrollIntoViewIfNeeded();
      await expect(footer.getByTestId("aie-portal-entry-footer")).toBeVisible();
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return Math.max(doc.scrollWidth, document.body.scrollWidth) - doc.clientWidth;
      });
      expect(overflow, `overflow at ${width}`).toBeLessThanOrEqual(1);
    });
  }

  test("axe WCAG AA light/dark on group surfaces including footer", async ({ browser }) => {
    test.setTimeout(180_000);
    for (const theme of ["light", "dark"] as const) {
      const context = await browser.newContext();
      await context.addInitScript((value) => {
        window.localStorage.setItem("hamd.web.theme", value);
        window.localStorage.setItem("hamd.web.cookie-consent", "essential");
      }, theme);
      const page = await context.newPage();
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const path of ["/", "/group", "/businesses/almahbub-international", IE_PATH] as const) {
        await page.goto(path);
        await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
        await page.locator("footer").first().scrollIntoViewIfNeeded();
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa"])
          .exclude(".hamd-announcement-slider")
          .analyze();
        expect(
          results.violations,
          `${path} ${theme}: ${results.violations.map((item) => item.id).join(", ")}`,
        ).toEqual([]);
      }
      await context.close();
    }
  });
});
