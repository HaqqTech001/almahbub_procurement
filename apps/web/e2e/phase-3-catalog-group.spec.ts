import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("phase 3 catalogue and phase 4 group", () => {
  test("products page empty catalogue is designed and shareable", async ({ page }) => {
    await page.goto("/products?category=iphones-gadgets");
    await expect(page.locator("main")).toBeVisible();
    await expect(page).toHaveURL(/category=iphones-gadgets/);
    await expect(page.getByRole("search")).toBeVisible();
    await expect(page.getByLabel(/search products/i)).toBeVisible();
  });

  test("group page distinguishes the two businesses", async ({ page }) => {
    await page.goto("/group");
    const main = page.locator("main");
    await expect(main.getByRole("heading", { name: "Almahbub Group" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(main.getByText(/two distinct businesses/i)).toBeVisible();
    await expect(main.locator(".hamd-group-structure")).toBeVisible();
    await expect(main.locator(".hamd-group-card").getByRole("heading", { name: "Almahbub International" })).toBeVisible();
    await expect(
      main.locator(".hamd-group-card").getByRole("heading", { name: "Almahbub Integrated Export Ltd." }),
    ).toBeVisible();
  });

  test("business pages are distinct companies", async ({ page }) => {
    await page.goto("/businesses");
    await expect(page).toHaveURL(/\/group$/);

    await page.goto("/businesses/almahbub-international");
    await expect(page.locator("main").getByRole("heading", { name: "Almahbub International" })).toBeVisible();
    await expect(page.locator("main").getByText(/part of almahbub group/i).first()).toBeVisible();
    await expect(page.locator("main").getByRole("link", { name: /product catalogue/i })).toBeVisible();

    await page.goto("/businesses/almahbub-integrated-export");
    await expect(
      page.locator("main").getByRole("heading", { name: "Almahbub Integrated Export Ltd." }),
    ).toBeVisible();
    await expect(page.locator(".hamd-aie-portal")).toBeVisible();
    await expect(page.locator("#commodities")).toBeVisible();
    await expect(page.locator("#bulk-supply")).toBeVisible();
    await expect(page.locator("#export")).toBeVisible();
    await expect(page.locator("main").getByText(/part of almahbub group/i).first()).toBeVisible();
    await expect(page.getByText(/add to cart/i)).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("data-business", "almahbub-integrated-export");
  });

  test("homepage discovery routes into Integrated Export portal", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/");
    await expect(page.getByRole("link", { name: /explore our businesses/i }).first()).toBeVisible();

    await page.locator("[data-testid='deferred-below-fold']").scrollIntoViewIfNeeded();
    const sisterSection = page.locator("#integrated-export-discovery");
    await expect(sisterSection).toBeVisible({ timeout: 30_000 });
    // Discovery sits after International company overview — not buried after FAQ alone.
    const overviewBox = await page.locator("#company-overview").boundingBox();
    const sisterBox = await sisterSection.boundingBox();
    expect(overviewBox && sisterBox && sisterBox.y > overviewBox.y).toBeTruthy();
    await expect(sisterSection.locator(".hamd-business-relation")).toBeVisible();
    await expect(sisterSection.getByText(/current website/i)).toBeVisible();
    await expect(sisterSection.getByText(/explore our other business/i)).toBeVisible();
    const sisterCta = sisterSection.getByRole("link", { name: /explore integrated export/i });
    await sisterCta.scrollIntoViewIfNeeded();
    await expect(sisterCta).toBeVisible();
    await sisterCta.click();
    await expect(page).toHaveURL(/\/businesses\/almahbub-integrated-export$/);
    await expect(page.locator(".hamd-aie-portal")).toBeVisible();
    await expect(
      page.locator("main").getByRole("heading", { name: "Almahbub Integrated Export Ltd." }),
    ).toBeVisible();
    await expect(page.locator("main").getByRole("link", { name: /make an enquiry/i }).first()).toBeVisible();
  });

  test("group pages axe WCAG AA in both themes", async ({ browser }) => {
    test.setTimeout(180_000);
    for (const theme of ["light", "dark"] as const) {
      const context = await browser.newContext();
      await context.addInitScript((value) => {
        window.localStorage.setItem("hamd.web.theme", value);
      }, theme);
      const page = await context.newPage();
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const path of [
        "/",
        "/group",
        "/businesses/almahbub-integrated-export",
        "/businesses/almahbub-international",
      ]) {
        await page.goto(path);
        await page.waitForLoadState("domcontentloaded");
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator("main")).toBeVisible();
        const dismiss = page.getByRole("button", { name: /^dismiss$/i });
        if (await dismiss.count()) {
          await dismiss.first().click({ force: true }).catch(() => undefined);
        }
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa"])
          .exclude(".hamd-announcement-slider")
          .analyze();
        expect(results.violations, `${path} ${theme}`).toEqual([]);
      }
      await context.close();
    }
  });

  test("no horizontal overflow on group surfaces at narrow widths", async ({ page }) => {
    test.setTimeout(180_000);
    for (const width of [320, 360, 375, 390, 414, 480, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/", "/group", "/businesses/almahbub-international", "/businesses/almahbub-integrated-export"]) {
        await page.goto(path);
        await page.waitForLoadState("domcontentloaded");
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth > doc.clientWidth + 1;
        });
        expect(overflow, `${path} @ ${width}`).toBe(false);
      }
    }
  });

  test("group cards are keyboard reachable", async ({ page }) => {
    await page.goto("/group");
    await page.locator(".hamd-group-card a").first().focus();
    await expect(page.locator(".hamd-group-card a").first()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  });
});
