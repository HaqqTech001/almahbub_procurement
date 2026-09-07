import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = path.join(HERE, "../test-results/celebration-fx");

/**
 * Visual gate for premium Rowdotul HAMD'26 announcement celebration layers.
 * Run against a live web server: HAMD_WEB_URL=http://127.0.0.1:3000
 */
test.describe("global wedding celebration effects", () => {
  test("desktop strip keeps compact height and shows celebration layers", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(90_000);

    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (text.includes("Failed to load resource")) return;
      consoleErrors.push(text);
    });

    await page.goto("/");
    const banner = page.locator(".hamd-announcement-slider");
    await expect(banner).toBeVisible({ timeout: 45_000 });

    const metrics = await banner.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const fx = el.querySelector(".hamd-celebration-fx");
      const balloons = el.querySelectorAll(".hamd-celebration-fx__balloon").length;
      const rain = el.querySelectorAll(".hamd-celebration-fx__rain-particle").length;
      const pops = el.querySelectorAll(".hamd-celebration-fx__balloon--pops").length;
      const stage = el.querySelectorAll(".hamd-celebration-fx__stage").length;
      const stars = el.querySelectorAll(".hamd-celebration-fx__star").length;
      const poppers = el.querySelectorAll(".hamd-celebration-fx__popper").length;
      const vh = window.innerHeight || 1;
      return {
        heightPx: rect.height,
        heightVh: (rect.height / vh) * 100,
        hasFx: Boolean(fx),
        balloons,
        rain,
        pops,
        stage,
        stars,
        poppers,
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });

    expect(metrics.hasFx).toBe(true);
    expect(metrics.stage).toBe(1);
    expect(metrics.poppers).toBeGreaterThan(0);
    expect(metrics.stars).toBeGreaterThan(0);
    expect(metrics.balloons).toBeGreaterThan(0);
    expect(metrics.rain).toBeGreaterThan(0);
    expect(metrics.pops).toBeGreaterThan(0);
    expect(metrics.heightVh).toBeLessThanOrEqual(5.5);
    expect(metrics.overflowX).toBe(false);

    for (const width of [320, 360, 375, 390, 414] as const) {
      await page.setViewportSize({ width, height: 740 });
      const mobile = await banner.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        return {
          heightVh: (rect.height / vh) * 100,
          overflowX:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth + 1,
        };
      });
      expect(mobile.overflowX, `${width}px overflow`).toBe(false);
      expect(mobile.heightVh, `${width}px height`).toBeLessThanOrEqual(6);
    }

    // Watch several slide cycles (~2.5s each) for live motion.
    await page.waitForTimeout(8_000);
    await banner.screenshot({
      path: path.join(EVIDENCE, "celebration-fx-desktop.png"),
    });

    // Open mobile menu — drawer/backdrop must still outrank the strip.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".hamd-cookie").getByRole("button").first().click({ timeout: 3_000 }).catch(() => undefined);
    const menu = page.getByRole("button", { name: /open menu/i });
    await menu.click({ force: true });
    await expect(page.locator(".hamd-header__drawer-backdrop.is-open")).toBeVisible({ timeout: 10_000 });
    const covers = await page.evaluate(() => {
      const backdrop = document.querySelector(".hamd-header__drawer-backdrop.is-open");
      const strip = document.querySelector(".hamd-announcement-slider");
      if (!backdrop || !strip) return false;
      const bz = Number.parseInt(getComputedStyle(backdrop).zIndex || "0", 10);
      const az = Number.parseInt(getComputedStyle(strip).zIndex || "0", 10);
      return bz > az;
    });
    expect(covers).toBe(true);

    expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
  });
});
