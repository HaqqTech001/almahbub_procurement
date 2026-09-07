import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const CATEGORY_SLUGS = [
  "iphones-gadgets",
  "medical-equipments",
  "home-garden-wares",
  "machineries",
  "general-procurement",
] as const;

test.describe("phase 5 product discovery catalogue", () => {
  test("products page is a catalogue discovery surface", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("main")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /explore products & procurement categories/i }),
    ).toBeVisible();
    await expect(page.getByRole("search")).toBeVisible();
    await expect(page.getByLabel(/search products/i)).toBeVisible();
    await expect(page.getByRole("group", { name: /category filters/i })).toBeVisible();
  });

  test("category query params select filters", async ({ page }) => {
    for (const slug of CATEGORY_SLUGS) {
      await page.goto(`/products?category=${slug}`);
      await expect(page).toHaveURL(new RegExp(`category=${slug}`));
      await expect(page.locator("main")).toBeVisible();
      await expect(page.getByRole("search")).toBeVisible();
    }
  });

  test("empty published catalogue remains intentional", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("search")).toBeVisible();
    const productCards = page.locator(".hamd-disc-card:not(.hamd-disc-card--skeleton)");
    await expect
      .poll(async () => page.locator("[aria-busy='true']").count(), { timeout: 15_000 })
      .toBe(0);
    const count = await productCards.count();
    if (count === 0) {
      const emptyOrError = page.getByRole("heading", {
        name: /published products will appear here|no products matched your search|unable to load products|category not found/i,
      });
      await expect(emptyOrError).toBeVisible();
    } else {
      await expect(productCards.first().getByRole("link", { name: /view product/i })).toBeVisible();
    }
    await expect(page.getByText(/add to cart|buy now|checkout/i)).toHaveCount(0);
  });

  test("homepage category discovery links into products", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/");
    await page.locator("[data-testid='deferred-below-fold']").scrollIntoViewIfNeeded();
    const categories = page.locator("#product-categories");
    await expect(categories).toBeVisible({ timeout: 30_000 });
    await expect(
      categories.getByRole("heading", { name: /what can we source for you/i }),
    ).toBeVisible();
    const catalogueCta = categories.getByRole("link", { name: /explore full catalogue/i });
    await expect(catalogueCta).toHaveAttribute("href", "/products");
    const firstCategory = categories.locator(".hamd-categories__card").first();
    if (await firstCategory.count()) {
      const href = await firstCategory.getAttribute("href");
      expect(href).toMatch(/\/products\?category=/);
      await firstCategory.click();
      await expect(page).toHaveURL(/\/products\?category=/);
    }
  });

  test("products axe WCAG AA in both themes", async ({ browser }) => {
    test.setTimeout(120_000);
    for (const theme of ["light", "dark"] as const) {
      const context = await browser.newContext();
      await context.addInitScript((value) => {
        window.localStorage.setItem("hamd.web.theme", value);
      }, theme);
      const page = await context.newPage();
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/products");
      await expect(page.locator("main")).toBeVisible();
      const dismiss = page.getByRole("button", { name: /^dismiss$/i });
      if (await dismiss.count()) {
        await dismiss.first().click({ force: true }).catch(() => undefined);
      }
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .exclude(".hamd-announcement-slider")
        .analyze();
      expect(results.violations, `/products ${theme}`).toEqual([]);

      const firstCard = page.locator(".hamd-disc-card:not(.hamd-disc-card--skeleton) a").first();
      if (await firstCard.count()) {
        await firstCard.click();
        await expect(page.locator("main")).toBeVisible();
        const detailResults = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa"])
          .exclude(".hamd-announcement-slider")
          .analyze();
        expect(detailResults.violations, `product detail ${theme}`).toEqual([]);
      }
      await context.close();
    }
  });

  test("no horizontal overflow on products at narrow widths", async ({ page }) => {
    test.setTimeout(120_000);
    for (const width of [320, 360, 375, 390, 414, 480, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/products");
      await page.waitForLoadState("domcontentloaded");
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth > doc.clientWidth + 1;
      });
      expect(overflow, `/products @ ${width}`).toBe(false);
    }
  });
});
