import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import {
  buyerEmail,
  buyerPassword,
  loginOps,
  openAdminNav,
  opsEmail,
  opsPassword,
  waitForAdminShell,
} from "./admin-helpers.js";

test.describe("phase 7 gate 2 admin console", () => {
  test("buyer without ops:access cannot enter the admin console", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.skip(
      !buyerEmail || !buyerPassword,
      "HAMD_BUYER_E2E_EMAIL / HAMD_BUYER_E2E_PASSWORD required",
    );
    await page.goto("/login");
    await page.getByRole("textbox", { name: /email/i }).fill(buyerEmail);
    await page.locator('input[type="password"][name="password"]').fill(buyerPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/unauthorized/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /forbidden/i })).toBeVisible();
    await expect(page.locator(".hamd-admin-shell")).toHaveCount(0);
  });

  test("ops_admin reaches dashboard, users, and real modules", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.skip(!opsEmail || !opsPassword, "HAMD_OPS_E2E_EMAIL / HAMD_OPS_E2E_PASSWORD required");
    test.setTimeout(240_000);

    await loginOps(page);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText(/here is what is happening across almahbub/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: /inventory/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /analytics/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /purchase orders/i })).toHaveCount(0);

    const modules: Array<{ name: RegExp; heading: RegExp }> = [
      { name: /^users$/i, heading: /^users$/i },
      { name: /^products$/i, heading: /product/i },
      { name: /^requests$/i, heading: /request/i },
      { name: /^quotations$/i, heading: /quotation/i },
      { name: /^invoices$/i, heading: /invoice/i },
      { name: /^payments$/i, heading: /payment/i },
      { name: /^shipments$/i, heading: /shipment/i },
      { name: /^announcements$/i, heading: /announcement/i },
      { name: /^audit log$/i, heading: /audit/i },
    ];
    for (const item of modules) {
      await openAdminNav(page, item.name);
      await expect(page.locator("main h1, main h2").first()).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.locator("main")).toContainText(item.heading);
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForAdminShell(page);
    await expect(page).not.toHaveURL(/\/login/);

    await page.getByRole("button", { name: /sign out/i }).locator("visible=true").first().click();
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
    await loginOps(page);
    await expect(page.locator(".hamd-admin-shell")).toBeVisible();
  });

  test("login, unauthorized, and dashboard axe WCAG AA", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.setTimeout(180_000);

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
    ).toEqual([]);

    await page.goto("/unauthorized");
    expect(
      (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
    ).toEqual([]);

    test.skip(!opsEmail || !opsPassword, "HAMD_OPS_E2E_EMAIL / HAMD_OPS_E2E_PASSWORD required");
    await loginOps(page);
    await expect(page.locator(".hamd-ops-host-loading, .hamd-skeleton[aria-busy='true']")).toHaveCount(
      0,
      { timeout: 30_000 },
    );
    const dashboardAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      dashboardAxe.violations,
      dashboardAxe.violations.map((item) => `${item.id}(${item.nodes.length})`).join(", "),
    ).toEqual([]);
  });
});
