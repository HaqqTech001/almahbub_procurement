import { expect, test } from "@playwright/test";

test.describe("PHASE 03.7.5 real-browser bootstrap", () => {
  test("public products leave the skeleton and show catalogue or a recoverable error", async ({
    page,
  }) => {
    const failed: string[] = [];
    page.on("requestfailed", (request) => {
      failed.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`);
    });

    await page.goto("/products");
    await expect(page.getByRole("heading", { name: /^products$/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("searchbox", { name: /search products/i })).toBeVisible();

    await expect
      .poll(async () => page.locator(".hamd-product-grid [aria-busy='true']").count(), {
        timeout: 25_000,
      })
      .toBe(0);

    const productNames = page.locator(".hamd-product-grid article .hamd-disc-card__title");
    const empty = page.getByRole("heading", {
      name: /published products will appear here|no products matched your search/i,
    });
    const error = page.getByRole("heading", { name: /unable to load products/i });
    await expect(productNames.first().or(empty).or(error)).toBeVisible({ timeout: 15_000 });
    expect(failed.filter((row) => row.includes("/assets/") && row.includes("404"))).toEqual([]);
  });

  test("login does not stay on the session skeleton", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".hamd-auth-boot")).toHaveCount(0);
  });
});
