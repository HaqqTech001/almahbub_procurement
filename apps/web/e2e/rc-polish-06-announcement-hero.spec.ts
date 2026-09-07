import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = path.join(__dirname, "evidence", "rc-polish-06");

async function assertNoOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(doc.scrollWidth, document.body.scrollWidth) - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

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
    for (const key of Object.keys(window.localStorage)) {
      if (key.includes("campaign.dismissed")) window.localStorage.removeItem(key);
    }
  });
}

test.describe("RC-POLISH-06 announcement slider + hero", () => {
  test.setTimeout(120_000);

  test("desktop announcement + hero", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop only");
    await context.clearCookies();
    await dismissOverlays(page);

    for (const width of [1280, 1920] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "networkidle" });
      const slider = page.locator(".hamd-announcement-slider");
      await expect(slider).toBeVisible({ timeout: 60_000 });
      await expect(
        slider.getByText(
          /Alhamdulillah|Rowdotul HAMD'26|A beautiful union|Two hearts|With joy|A new chapter|May Allah bless/i,
        ).first(),
      ).toBeVisible();
      await expect(page.locator("header.hamd-header")).toBeVisible();
      await expect(page.locator(".hamd-header__lang")).toHaveCount(0);
      await expect(page.locator("header.hamd-header").getByRole("link", { name: "Request Procurement" })).toHaveCount(0);
      await assertNoOverflow(page);
      await page.screenshot({
        path: path.join(EVIDENCE, `desktop-announcement-hero-${width}.png`),
        fullPage: false,
        animations: "disabled",
      });
      await slider.screenshot({
        path: path.join(EVIDENCE, `desktop-announcement-slider-${width}.png`),
        animations: "disabled",
      });
      await page.locator("header.hamd-header").screenshot({
        path: path.join(EVIDENCE, `navbar-${width}.png`),
        animations: "disabled",
      });
    }

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const wedding = page.locator(".hamd-announcement-slider");
    await expect(
      wedding.getByText(
        /Alhamdulillah|Rowdotul HAMD'26|A beautiful union|Two hearts|With joy|A new chapter|May Allah bless/i,
      ).first(),
    ).toBeVisible();
    await expect(page.locator(".hamd-celebration-fx").first()).toBeVisible();
    // Capture celebration decor while motion is still running (viewport crop).
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(EVIDENCE, "wedding-celebration-animation-1280.png"),
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 240 },
    });
    await wedding.screenshot({
      path: path.join(EVIDENCE, "wedding-announcement-1280.png"),
    });
    await wedding.screenshot({
      path: path.join(EVIDENCE, "desktop-announcement-slider-1280.png"),
    });

    await wedding.focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      wedding.getByText(
        /Alhamdulillah|Rowdotul HAMD'26|A beautiful union|Two hearts|With joy|A new chapter|May Allah bless|the celebration continues/i,
      ).first(),
    ).toBeVisible();
    await page.screenshot({
      path: path.join(EVIDENCE, "desktop-multi-announcement-1280.png"),
      fullPage: false,
      animations: "disabled",
    });
    await page.keyboard.press("ArrowLeft");
    await expect(
      wedding.getByText(
        /Alhamdulillah|Rowdotul HAMD'26|A beautiful union|Two hearts|With joy|A new chapter|May Allah bless/i,
      ).first(),
    ).toBeVisible();

    const card = page.locator(".hamd-hero-visual__card").first();
    await expect(card).toBeVisible();
    const radii = await card.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        tl: s.borderTopLeftRadius,
        tr: s.borderTopRightRadius,
        br: s.borderBottomRightRadius,
        bl: s.borderBottomLeftRadius,
      };
    });
    expect(parseFloat(radii.tl)).toBeGreaterThan(8);
    expect(parseFloat(radii.bl)).toBeGreaterThan(8);
    expect(parseFloat(radii.tr)).toBe(0);
    expect(parseFloat(radii.br)).toBe(0);
    // Card float animation never settles; disable animations for a stable crop.
    await card.screenshot({
      path: path.join(EVIDENCE, "hero-card-border-1280.png"),
      animations: "disabled",
    });
  });

  test("mobile announcement + stacked hero panel", async ({ page, context }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-desktop" && testInfo.project.name !== "chromium-mobile",
      "chromium only",
    );
    await context.clearCookies();
    await dismissOverlays(page);

    for (const width of [390, 430] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.locator(".hamd-announcement-slider")).toBeVisible({ timeout: 60_000 });
      await assertNoOverflow(page);

      const alignment = await page.evaluate(() => {
        const layout = document.querySelector(".hamd-hero__layout") as HTMLElement | null;
        const stage = document.querySelector(".hamd-hero__stage") as HTMLElement | null;
        const cards = document.querySelector(".hamd-hero-visual__cards") as HTMLElement | null;
        if (!layout || !stage || !cards) return null;
        const lr = layout.getBoundingClientRect();
        const sr = stage.getBoundingClientRect();
        const cr = cards.getBoundingClientRect();
        return {
          stageOffset: Math.abs(sr.left - lr.left),
          cardsOffset: Math.abs(cr.left - sr.left),
          cardsWidthRatio: cr.width / sr.width,
        };
      });
      expect(alignment).not.toBeNull();
      expect(alignment!.stageOffset).toBeLessThan(8);
      expect(alignment!.cardsOffset).toBeLessThan(12);
      expect(alignment!.cardsWidthRatio).toBeGreaterThan(0.92);

      await page.locator(".hamd-announcement-slider").screenshot({
        path: path.join(EVIDENCE, `mobile-announcement-${width}.png`),
        animations: "disabled",
      });
      await page.screenshot({
        path: path.join(EVIDENCE, `mobile-announcement-hero-${width}.png`),
        fullPage: false,
        animations: "disabled",
      });
      await page.locator(".hamd-hero__stage").screenshot({
        path: path.join(EVIDENCE, `mobile-stacked-panel-${width}.png`),
        animations: "disabled",
      });
    }
  });
});
