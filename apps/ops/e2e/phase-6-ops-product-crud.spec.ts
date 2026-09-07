import { expect, test } from "@playwright/test";

import { loginOps, opsEmail, opsPassword } from "./admin-helpers.js";

const email = opsEmail;
const password = opsPassword;
const publicWeb = process.env.HAMD_WEB_URL ?? "http://127.0.0.1:4173";

test.describe("phase 6 ops product + category CRUD", () => {
  test("create draft, publish, archive against live API", async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.skip(
      !email || !password,
      "Set HAMD_OPS_E2E_EMAIL and HAMD_OPS_E2E_PASSWORD to run live ops CRUD.",
    );
    test.setTimeout(180_000);

    const slug = `ops-e2e-${Date.now()}`;
    const name = `Ops E2E ${Date.now()}`;

    await loginOps(page);
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: /create product|edit product/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByLabel(/^Name$/i).fill(name);
    await page.getByLabel(/^Slug$/i).fill(slug);
    await page.getByLabel(/^Description$/i).fill("Electric hospital beds for ward use.");
    const category = page.getByLabel(/^Category$/i);
    const options = category.locator("option");
    if ((await options.count()) > 1) {
      await category.selectOption({ index: 1 });
    }
    await page.getByRole("button", { name: /create draft/i }).click();
    await expect(page.getByRole("status")).toContainText(/draft/i, { timeout: 20_000 });

    const publicPage = await browser.newPage();
    await publicPage.goto(`${publicWeb}/products`);
    await expect(publicPage.locator("main")).toBeVisible({ timeout: 20_000 });
    await expect(publicPage.getByText(name)).toHaveCount(0);

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /^Publish$/i }).click();
    await expect(page.getByRole("status")).toContainText(/published/i, { timeout: 20_000 });

    await publicPage.goto(`${publicWeb}/products`);
    await expect(publicPage.getByText(name)).toBeVisible({ timeout: 30_000 });
    await publicPage.goto(`${publicWeb}/product/${slug}`);
    await expect(publicPage.getByRole("heading", { name })).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: /^Archive$/i }).click();
    await expect(page.getByRole("status")).toContainText(/archived/i, { timeout: 20_000 });
    await publicPage.goto(`${publicWeb}/products`);
    await expect(publicPage.getByText(name)).toHaveCount(0);
    await publicPage.close();
  });

  test("category list loads without fixture fallback", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.skip(
      !email || !password,
      "Set HAMD_OPS_E2E_EMAIL and HAMD_OPS_E2E_PASSWORD to run live category checks.",
    );
    await loginOps(page);
    await page.goto("/categories");
    await expect(page.getByRole("heading", { name: /create category|edit category/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/medical equipments|iphones|machineries|garden|procurement/i)).toBeVisible();
    await expect(page.getByText(/fixtures/i)).toHaveCount(0);
  });
});
