import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import { loginOps, openAdminNav, opsEmail, opsPassword } from "./admin-helpers.js";

const VIEWPORTS = [320, 360, 375, 390, 414, 768, 1024, 1280, 1440] as const;

test.describe("authority ops request and CMS", () => {
  test.setTimeout(180_000);

  test("ops request detail exposes administrative actions without buyer verbs", async ({
    page,
  }, testInfo) => {
    test.skip(
      !opsEmail || !opsPassword,
      "HAMD_OPS_E2E_EMAIL / HAMD_OPS_E2E_PASSWORD required",
    );
    await loginOps(page);
    await openAdminNav(page, /requests/i);
    await expect(page.getByRole("heading", { name: /all requests/i })).toBeVisible({
      timeout: 45_000,
    });
    const firstView = page.getByRole("button", { name: /^view$/i }).first();
    if (await firstView.count()) {
      await firstView.click();
      await expect(page).toHaveURL(/\/requests\/[^/]+/);
      await expect(page.getByRole("heading", { name: /operational next actions/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /your next step/i })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: /customer/i })).toBeVisible();
      const approveQuote = page.getByRole("button", { name: /approve quote/i });
      const approveSourcing = page.getByRole("button", { name: /approve for sourcing/i });
      if ((await approveQuote.count()) && (await approveSourcing.count())) {
        throw new Error("Ops must not show mutually exclusive approve commands together.");
      }
    }

    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(
        () =>
          Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) -
          document.documentElement.clientWidth,
      );
      expect(overflow, `overflow at ${width}`).toBeLessThanOrEqual(1);
    }
  });

  test("ops CMS exposes announcement media controls", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.skip(
      !opsEmail || !opsPassword,
      "HAMD_OPS_E2E_EMAIL / HAMD_OPS_E2E_PASSWORD required",
    );
    await loginOps(page);
    await openAdminNav(page, /announcements/i);
    await expect(page).toHaveURL(/\/cms/);
    await expect(page.getByRole("heading", { name: /^announcements$/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/does not replace the Rowdotul HAMD'26/i)).toBeVisible();
    await expect(
      page.getByLabel(/media \(images, video, or files/i),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
  });
});
