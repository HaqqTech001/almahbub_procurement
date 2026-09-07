import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const IE = "/businesses/almahbub-integrated-export";
const CATALOGUE = `${IE}/commodities`;
const API_LIST = "/api/v1/integrated-export/commodities?page=1&pageSize=100&sort=sortOrder";

type ApiMedia = { src: string; alt: string };
type ApiListItem = {
  slug: string;
  name: string;
  published: boolean;
  heroMedia: ApiMedia | null;
};

async function dismissOverlays(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("hamd.web.cookie-consent", "essential");
    window.localStorage.setItem(
      "hamd.web.guidance.preference",
      JSON.stringify({
        mode: "off",
        neverAutoStart: true,
        welcomeCompletedAt: "2026-08-17T00:00:00.000Z",
        locale: "en",
        suppressedTourKeys: [],
      }),
    );
  });
}

test.describe("IE-11C media rendering pipeline", () => {
  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page);
  });

  test("public API and catalogue stay empty until owner-verified publication", async ({
    page,
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(120_000);

    const apiResponse = await request.get(API_LIST);
    expect(apiResponse.ok(), `IE commodities API HTTP ${apiResponse.status()}`).toBeTruthy();
    const envelope = (await apiResponse.json()) as { data?: ApiListItem[] };
    const rows = Array.isArray(envelope.data) ? envelope.data : [];
    expect(rows.filter((row) => row.published)).toHaveLength(0);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(CATALOGUE);
    await expect(page.locator(".hamd-aie-catalogue")).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: /no commodities published yet/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sesame Seeds", exact: true })).toHaveCount(0);
    await expect(page.getByText(/not Almahbub facilities/i)).toHaveCount(0);
  });

  test("light, dark, and mobile empty catalogue remain usable", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "viewport control");
    test.setTimeout(120_000);

    for (const theme of ["light", "dark"] as const) {
      await page.addInitScript((value) => {
        window.localStorage.setItem("hamd.web.theme", value);
      }, theme);
      for (const width of [375, 1280] as const) {
        await page.setViewportSize({ width, height: 812 });
        await page.goto(CATALOGUE);
        await expect(page.locator(".hamd-aie-catalogue")).toBeVisible({ timeout: 30_000 });
        await expect(
          page.getByRole("heading", { name: /no commodities published yet/i }),
        ).toBeVisible();
      }
    }
  });

  test("axe WCAG AA on empty catalogue and unpublished detail", async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(180_000);

    for (const theme of ["light", "dark"] as const) {
      const context = await browser.newContext();
      await context.addInitScript((value) => {
        window.localStorage.setItem("hamd.web.theme", value);
        window.localStorage.setItem("hamd.web.cookie-consent", "essential");
        window.localStorage.setItem(
          "hamd.web.guidance.preference",
          JSON.stringify({
            mode: "off",
            neverAutoStart: true,
            welcomeCompletedAt: "2026-08-17T00:00:00.000Z",
            locale: "en",
            suppressedTourKeys: [],
          }),
        );
      }, theme);
      const page = await context.newPage();
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const path of [CATALOGUE, `${CATALOGUE}/sesame-seeds`] as const) {
        await page.goto(path);
        await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
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
