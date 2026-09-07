import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = path.join(__dirname, "evidence", "rc-polish-04");

const WIDTHS = [390, 430, 768, 1024, 1280, 1920] as const;

async function metrics(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const search = document.querySelector(".hamd-hero__search") as HTMLElement | null;
    const cards = Array.from(
      document.querySelectorAll(".hamd-hero-visual__card"),
    ) as HTMLElement[];
    const accountMenu = document.querySelector(".hamd-header__account-menu");

    function rect(el: HTMLElement | null) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    }

    function overlaps(a: DOMRect, b: DOMRect) {
      const dx = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const dy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      /* Ignore sub-pixel / border collisions under 1px. */
      return dx > 1 && dy > 1;
    }

    const searchRect = search?.getBoundingClientRect() ?? null;
    const cardRects = cards.map((c) => c.getBoundingClientRect());
    const searchOverCards =
      searchRect &&
      cardRects.some((c) => overlaps(searchRect, c));
    const cardsOverlapEachOther = cardRects.some((a, i) =>
      cardRects.some((b, j) => i < j && overlaps(a, b)),
    );

    return {
      overflow: Math.max(doc.scrollWidth, document.body.scrollWidth) - doc.clientWidth,
      cardCount: cards.length,
      searchOverCards: Boolean(searchOverCards),
      cardsOverlapEachOther,
      accountMenuPresent: Boolean(accountMenu),
      split: Boolean(document.querySelector(".hamd-hero--split")),
      search: rect(search),
    };
  });
}

async function dismissBlockingOverlays(page: import("@playwright/test").Page) {
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

async function dismissCookieBannerIfPresent(page: import("@playwright/test").Page) {
  const essential = page.getByRole("button", { name: /essential only/i });
  if (await essential.count()) {
    await essential.first().click({ force: true }).catch(() => undefined);
  }
  const accept = page.getByRole("button", { name: /accept all/i });
  if (await accept.count()) {
    await accept.first().click({ force: true }).catch(() => undefined);
  }
}

test.describe("RC-POLISH-04 hero + account panel", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  for (const width of WIDTHS) {
    test(`hero cards do not overlap at ${width}px`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium-desktop", "desktop project captures widths");
      await dismissBlockingOverlays(page);
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.locator("section.hamd-hero")).toBeVisible({ timeout: 30_000 });
      await dismissCookieBannerIfPresent(page);
      await expect(page.locator(".hamd-hero__search")).toBeVisible();
      if (width <= 768) {
        await page.locator(".hamd-hero__stage").scrollIntoViewIfNeeded();
      }

      const result = await metrics(page);
      expect(result.split).toBe(true);
      expect(result.cardCount).toBe(3);
      expect(result.searchOverCards).toBe(false);
      expect(result.cardsOverlapEachOther).toBe(false);
      expect(result.overflow).toBeLessThanOrEqual(1);
      expect(result.accountMenuPresent).toBe(false);

      await page.screenshot({
        path: path.join(EVIDENCE, `homepage-closed-${width}.png`),
        fullPage: false,
      });
    });
  }

  test("account menu opens and closes on authenticated public header", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop project only");
    await dismissBlockingOverlays(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/__e2e__/public-header-auth");
    await expect(page.locator("header.hamd-header")).toBeVisible({ timeout: 30_000 });
    await dismissCookieBannerIfPresent(page);
    await expect(page.locator(".hamd-header__account-menu")).toHaveCount(0);

    await page.getByRole("button", { name: /ada okoro/i }).click();
    await expect(page.getByRole("menu", { name: "Account" })).toBeVisible();
    await page.screenshot({
      path: path.join(EVIDENCE, "homepage-account-open-1280.png"),
      fullPage: false,
    });

    await page.keyboard.press("Escape");
    await expect(page.locator(".hamd-header__account-menu")).toHaveCount(0);

    await page.getByRole("button", { name: /ada okoro/i }).click();
    await expect(page.getByRole("menu", { name: "Account" })).toBeVisible();
    await page.getByRole("button", { name: /ada okoro/i }).click();
    await expect(page.locator(".hamd-header__account-menu")).toHaveCount(0);

    await page.getByRole("button", { name: /ada okoro/i }).click();
    await page.locator("#main-content").click({ position: { x: 40, y: 120 } });
    await expect(page.locator(".hamd-header__account-menu")).toHaveCount(0);

    const result = await metrics(page);
    expect(result.searchOverCards).toBe(false);
    expect(result.accountMenuPresent).toBe(false);

    await page.screenshot({
      path: path.join(EVIDENCE, "homepage-account-closed-1280.png"),
      fullPage: false,
    });
  });

  test("mobile avatar opens drawer instead of desktop account dropdown", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "mobile project only");
    await dismissBlockingOverlays(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/__e2e__/public-header-auth");
    await expect(page.locator("header.hamd-header")).toBeVisible({ timeout: 30_000 });
    await dismissCookieBannerIfPresent(page);
    const accountBtn = page.locator("header.hamd-header .hamd-header__account-btn");
    await expect(accountBtn).toBeVisible();
    await accountBtn.click({ force: true });
    await expect(page.locator(".hamd-header__drawer.is-open")).toBeVisible();
    await expect(page.locator(".hamd-header__account-menu")).toHaveCount(0);
    await page.screenshot({
      path: path.join(EVIDENCE, "homepage-account-mobile-390.png"),
      fullPage: false,
    });
  });
});
