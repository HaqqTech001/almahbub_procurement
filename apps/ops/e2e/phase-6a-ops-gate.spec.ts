import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loginOps, openAdminNav, opsEmail, opsPassword, waitForAdminShell } from "./admin-helpers.js";

const email = opsEmail;
const password = opsPassword;
const publicWeb = process.env.HAMD_WEB_URL ?? "http://127.0.0.1:3000";
const WIDTHS = [320, 360, 375, 390, 414, 480, 768, 1024, 1280, 1440, 1920] as const;

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function login(page: Page) {
  await loginOps(page);
}

async function setOpsTheme(page: Page, theme: "light" | "dark") {
  const toggle = page.getByRole("button", { name: /theme/i });
  await expect(toggle).toBeVisible({ timeout: 15_000 });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const current = await page.evaluate(() =>
      document.documentElement.classList.contains("dark") ||
      document.documentElement.dataset.theme === "dark"
        ? "dark"
        : "light",
    );
    if (current === theme) return;
    await toggle.click();
  }
  await expect
    .poll(async () =>
      page.evaluate(() =>
        document.documentElement.classList.contains("dark") ||
        document.documentElement.dataset.theme === "dark"
          ? "dark"
          : "light",
      ),
    )
    .toBe(theme);
}

async function openNav(page: Page, name: RegExp) {
  await openAdminNav(page, name);
}

async function assertNoOverflow(page: Page, width: number) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: Math.max(doc.scrollWidth, document.body.scrollWidth),
      clientWidth: doc.clientWidth,
    };
  });
  expect(
    metrics.scrollWidth,
    `horizontal overflow at ${width}px (scroll=${metrics.scrollWidth}, client=${metrics.clientWidth})`,
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

test.describe.configure({ mode: "serial" });

test.describe("phase 6a ops browser gate", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.skip(!email || !password, "HAMD_OPS_E2E_EMAIL / HAMD_OPS_E2E_PASSWORD required");
  });

  test("product draft → image → publish → public → archive", async ({
    page,
    browser,
  }) => {
    test.setTimeout(240_000);
    const stamp = Date.now();
    const name = `Phase6A Test Bed ${stamp}`;
    const slug = `phase6a-test-bed-${stamp}`;
    const imagePath = join(tmpdir(), `${slug}.png`);
    await writeFile(imagePath, PNG_1X1);

    await login(page);
    await openNav(page, /^products$/i);
    await expect(page.getByRole("heading", { name: /create product/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByLabel(/^Name$/i).fill(name);
    await page.getByLabel(/^Slug$/i).fill(slug);
    await page.getByLabel(/^Description$/i).fill(
      "Temporary Phase 6A verification hospital bed. Not a production Almahbub SKU.",
    );
    await page.getByRole("combobox", { name: /^Category$/i }).selectOption({
      label: "Medical Equipments",
    });
    await page.getByRole("button", { name: /create draft/i }).click();
    await expect(page.getByRole("status")).toContainText(/draft/i, { timeout: 30_000 });

    const publicPage = await browser.newPage();
    await publicPage.goto(`${publicWeb}/products`, { waitUntil: "networkidle" });
    await expect(publicPage.getByText(name)).toHaveCount(0);
    await publicPage.goto(`${publicWeb}/product/${slug}`, { waitUntil: "networkidle" });
    await expect(publicPage.getByRole("heading", { name: /product not found/i })).toBeVisible({
      timeout: 20_000,
    });

    await page.getByLabel(/^Upload image$/i).setInputFiles(imagePath);
    await expect(page.locator(".hamd-ops-gallery img")).toBeVisible({ timeout: 30_000 });
    const galleryAlt = page.locator(".hamd-ops-gallery__item").getByLabel(/^Alt text$/i);
    await galleryAlt.fill("Phase 6A test hospital bed photo");
    await galleryAlt.blur();
    await expect(page.getByRole("status")).toContainText(/image|alt|gallery|updated/i, {
      timeout: 20_000,
    });

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /^Publish$/i }).click();
    await expect(page.getByRole("status")).toContainText(/published/i, { timeout: 30_000 });

    await publicPage.goto(`${publicWeb}/products`, { waitUntil: "networkidle" });
    await expect(publicPage.getByText(name)).toBeVisible({ timeout: 30_000 });
    await publicPage.goto(`${publicWeb}/product/${slug}`, { waitUntil: "networkidle" });
    await expect(publicPage.getByRole("heading", { name })).toBeVisible({ timeout: 20_000 });
    await expect(
      publicPage.getByRole("link", { name: /^Medical Equipments$/i }).first(),
    ).toBeVisible();
    await expect(publicPage.getByText(/temporary phase 6a verification/i).first()).toBeVisible();
    await expect(
      publicPage.getByRole("img", { name: /phase 6a test hospital bed photo/i }),
    ).toBeVisible();
    await expect(publicPage.getByRole("link", { name: /request procurement/i }).first()).toBeVisible();
    await expect(publicPage.getByRole("link", { name: /contact almahbub/i }).first()).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForAdminShell(page);
    await openNav(page, /^products$/i);
    await page.getByRole("row", { name: new RegExp(slug, "i") }).click();
    await expect(page.getByRole("heading", { name: /edit product/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("combobox", { name: /publication state/i })).toHaveValue(
      "published",
    );
    await publicPage.reload({ waitUntil: "networkidle" });
    await expect(publicPage.getByRole("heading", { name })).toBeVisible();

    await page.getByRole("button", { name: /^Archive$/i }).click();
    await expect(page.getByRole("status")).toContainText(/archived/i, { timeout: 30_000 });
    await publicPage.goto(`${publicWeb}/products`, { waitUntil: "networkidle" });
    await expect(publicPage.getByText(name)).toHaveCount(0);
    await publicPage.goto(`${publicWeb}/product/${slug}`, { waitUntil: "networkidle" });
    await expect(publicPage.getByRole("heading", { name: /product not found/i })).toBeVisible();
    await publicPage.close();

    await page.getByRole("button", { name: /sign out/i }).locator("visible=true").first().click();
    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
  });

  test("announcement draft → publish → homepage slider → archive", async ({
    page,
    browser,
  }) => {
    test.setTimeout(180_000);
    const stamp = Date.now();
    const title = `Phase6A Notice ${stamp}`;
    const slug = `phase6a-notice-${stamp}`;

    await login(page);
    await openNav(page, /^announcements$/i);
    await expect(page.getByRole("heading", { name: /announcements/i }).first()).toBeVisible({
      timeout: 30_000,
    });
    await page.getByLabel(/^Title$/i).fill(title);
    await page.getByLabel(/^Slug$/i).fill(slug);
    await page.getByLabel(/^Summary$/i).fill("Temporary Phase 6A slider verification.");
    await page.getByLabel(/^Body$/i).fill("Temporary Phase 6A slider body.");
    await page.getByRole("combobox", { name: /^Status$/i }).selectOption("draft");
    await page.getByRole("button", { name: /save announcement/i }).click();
    await expect(page.getByRole("status").filter({ hasText: /saved|draft/i })).toBeVisible({
      timeout: 20_000,
    });

    const home = await browser.newPage();
    await home.goto(`${publicWeb}/`, { waitUntil: "networkidle" });
    await expect(home.getByText(title)).toHaveCount(0);

    await page.getByLabel(/^Title$/i).fill(`${title} published`);
    await page.getByLabel(/^Slug$/i).fill(`${slug}-pub`);
    await page.getByLabel(/^Summary$/i).fill("Temporary Phase 6A published slider.");
    await page.getByLabel(/^Body$/i).fill("Temporary Phase 6A published slider body.");
    await page.getByRole("combobox", { name: /^Status$/i }).selectOption("published");
    await page.getByRole("button", { name: /save announcement/i }).click();
    await expect(page.getByRole("status").filter({ hasText: /published/i })).toBeVisible({
      timeout: 20_000,
    });

    await home.goto(`${publicWeb}/`, { waitUntil: "networkidle" });
    const slider = home.locator(".hamd-announcement-slider");
    await expect(slider).toBeVisible({ timeout: 30_000 });
    await expect(slider.getByText(/temporary phase 6a published slider/i)).toBeVisible({
      timeout: 30_000,
    });
    if ((await slider.getByRole("button", { name: /next announcement/i }).count()) > 0) {
      await slider.getByRole("button", { name: /next announcement/i }).click();
      await slider.getByRole("button", { name: /previous announcement/i }).click();
    }
    await home.setViewportSize({ width: 375, height: 812 });
    await assertNoOverflow(home, 375);

    const leftovers = page
      .getByRole("listitem")
      .filter({ hasText: /phase6a-notice/i })
      .getByRole("button", { name: /^archive$/i });
    while ((await leftovers.count()) > 0) {
      const before = await leftovers.count();
      await leftovers.first().click();
      await expect.poll(async () => leftovers.count()).toBeLessThan(before);
    }
    await home.goto(`${publicWeb}/`, { waitUntil: "networkidle" });
    await expect(home.getByText(/temporary phase 6a published slider/i)).toHaveCount(0);
    await home.close();
  });

  test("authenticated ops responsive + axe light/dark", async ({ page }) => {
    test.setTimeout(480_000);
    await login(page);
    const navItems: Array<{ name: RegExp; heading: RegExp }> = [
      { name: /^dashboard$/i, heading: /dashboard|operations|overview|almahbub/i },
      { name: /^products$/i, heading: /create product|edit product|products/i },
      { name: /^categories$/i, heading: /categor/i },
      { name: /^requests$/i, heading: /request/i },
      { name: /^quotations$/i, heading: /quotation/i },
      { name: /^invoices$/i, heading: /invoice/i },
      { name: /^payments$/i, heading: /payment/i },
      { name: /^shipments$/i, heading: /shipment/i },
      { name: /^notifications$/i, heading: /notification/i },
      { name: /^announcements$/i, heading: /announcement/i },
    ];
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      for (const item of navItems) {
        await openNav(page, item.name);
        await expect(page.locator("main h1, main h2").first()).toBeVisible({
          timeout: 20_000,
        });
        if (item.name.source === "^requests$") {
          const row = page.locator(".hamd-pr-row").first();
          if (await row.count()) {
            await row.click();
            await expect(page.getByLabel(/request detail/i)).toBeVisible({
              timeout: 15_000,
            });
          }
        }
        await assertNoOverflow(page, width);
      }
    }

    await page.setViewportSize({ width: 1280, height: 900 });
    for (const theme of ["light", "dark"] as const) {
      await setOpsTheme(page, theme);
      for (const item of [
        { name: /^dashboard$/i },
        { name: /^products$/i },
        { name: /^announcements$/i },
      ]) {
        await openNav(page, item.name);
        await expect(page.locator(".hamd-ops-host-loading")).toHaveCount(0, {
          timeout: 20_000,
        });
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa"])
          .analyze();
        expect(
          results.violations,
          `axe violations on ${item.name} theme=${theme}: ${results.violations
            .map((v) => `${v.id}(${v.nodes.length})`)
            .join(", ")}`,
        ).toEqual([]);
      }
    }
  });
});
