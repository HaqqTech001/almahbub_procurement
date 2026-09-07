import { expect, test } from "@playwright/test";

const WIDTHS = [320, 360, 375, 390, 414, 480, 768, 1024, 1280, 1440, 1920] as const;

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

async function gotoReady(page: import("@playwright/test").Page, path = "/") {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("header.hamd-header")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("main#main-content, main")).toBeVisible({ timeout: 30_000 });
}

test.describe("RC-POLISH-02 responsive chrome", () => {
  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoReady(page);

      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        return {
          scrollWidth: Math.max(doc.scrollWidth, body.scrollWidth),
          clientWidth: doc.clientWidth,
          brand:
            document.querySelector(".hamd-header__brand")?.getAttribute("aria-label")?.trim() ||
            document.querySelector(".hamd-header__brand-name")?.textContent?.trim() ||
            "",
          hasHamdText: /Hamd Genesis|HAMD Genesis|@hamd/i.test(document.body.innerText),
        };
      });

      expect(
        metrics.scrollWidth,
        `horizontal overflow at ${width}px (scroll=${metrics.scrollWidth}, client=${metrics.clientWidth})`,
      ).toBeLessThanOrEqual(metrics.clientWidth + 1);
      expect(metrics.brand).toMatch(/Almahbub International/i);
      expect(metrics.hasHamdText).toBe(false);
    });
  }

  test("mobile menu opens as drawer without page overflow", async ({ page }) => {
    await dismissOverlays(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoReady(page);
    const menuBtn = page.locator("header.hamd-header").getByRole("button", {
      name: /open menu/i,
    });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click({ force: true });
    const drawer = page.locator(".hamd-header__drawer.is-open");
    await expect(drawer).toBeVisible({ timeout: 10_000 });
    await expect(drawer.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Sign Up" })).toBeVisible();

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);

    await page.keyboard.press("Escape");
    await expect(page.locator(".hamd-header__drawer.is-open")).toHaveCount(0);
  });

  test("anonymous /app redirects to login not unauthorized", async ({ page }) => {
    await page.goto("/app/requests");
    await page.waitForURL(/\/login/, { timeout: 30_000 });
    expect(page.url()).toMatch(/returnTo=/);
    expect(page.url()).not.toMatch(/unauthorized/);
  });

  test("product images render or branded placeholder", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoReady(page);

    /* Below-fold sections mount after intersection - scroll to reveal. */
    for (let i = 0; i < 12; i += 1) {
      if (
        (await page.locator("#product-categories").count()) ||
        (await page.locator("#featured-products").count())
      ) {
        break;
      }
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(250);
    }
    const discovery = page.locator("#product-categories, #featured-products").first();
    await expect(discovery).toBeVisible({ timeout: 45_000 });
    await discovery.scrollIntoViewIfNeeded();

    const cards = page.locator("#featured-products .hamd-cat-card");
    const empty = page.locator("#featured-products .hamd-products__empty");
    const categories = page.locator("#product-categories .hamd-categories__card");
    const cardCount = await cards.count();
    const emptyCount = await empty.count();
    const categoryCount = await categories.count();
    expect(cardCount + emptyCount + categoryCount).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(cardCount, 6); i += 1) {
      const card = cards.nth(i);
      const media = card.locator(".hamd-cat-card__media");
      const hasImg = (await media.locator("img").count()) > 0;
      const hasPh = (await media.locator(".hamd-cat-card__ph").count()) > 0;
      expect(hasImg || hasPh).toBe(true);
    }
  });

  test("footer shows Powered by HaqqTech only", async ({ page }) => {
    await gotoReady(page);
    await expect(page.getByText("Powered by HaqqTech")).toHaveCount(1);
    await expect(page.getByText(/Ilorin/i).first()).toBeVisible();
  });

  for (const width of [320, 390, 768] as const) {
    test(`workspace preview actions have no overflow at ${width}px`, async ({ page }) => {
      await dismissOverlays(page);
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/__e2e__/workspace-shell");
      await expect(page.locator(".hamd-workspace-home__actions, [data-guide='dashboard-attention']").first()).toBeVisible({
        timeout: 30_000,
      });
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return Math.max(doc.scrollWidth, document.body.scrollWidth) - doc.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  for (const width of [320, 360, 375, 414, 768] as const) {
    test(`login form has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/login");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator(".hamd-auth-shell")).toBeVisible({
        timeout: 30_000,
      });
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return Math.max(doc.scrollWidth, document.body.scrollWidth) - doc.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});

test.describe("Phase 4 group business cards", () => {
  for (const width of WIDTHS) {
    test(`group page has no overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/group");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator(".hamd-group-grid")).toBeVisible({ timeout: 30_000 });

      const metrics = await page.evaluate((viewportWidth) => {
        const doc = document.documentElement;
        const cards = Array.from(document.querySelectorAll(".hamd-group-card"));
        const rects = cards.map((card) => card.getBoundingClientRect());
        const first = rects[0];
        const second = rects[1];
        const stacked = Boolean(
          first && second && second.top >= first.bottom - 2,
        );
        const columns = Boolean(
          first && second && second.left >= first.right - 2,
        );
        return {
          scrollWidth: Math.max(doc.scrollWidth, document.body.scrollWidth),
          clientWidth: doc.clientWidth,
          stacked,
          columns,
          narrow: viewportWidth < 768,
          cardCount: cards.length,
        };
      }, width);

      expect(metrics.cardCount).toBe(2);
      if (metrics.narrow) {
        expect(metrics.stacked).toBe(true);
      } else {
        expect(metrics.columns).toBe(true);
      }
      expect(
        metrics.scrollWidth,
        `horizontal overflow at ${width}px (scroll=${metrics.scrollWidth}, client=${metrics.clientWidth})`,
      ).toBeLessThanOrEqual(metrics.clientWidth + 1);
    });
  }
});
