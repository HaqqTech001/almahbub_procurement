import { expect, test } from "@playwright/test";

import { loginOps, opsEmail, opsPassword } from "./admin-helpers.js";

const email = opsEmail;
const password = opsPassword;
const apiBase = (process.env.HAMD_API_URL ?? "http://127.0.0.1:4000").replace(
  /\/$/,
  "",
);

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/** Minimal valid-enough MP4 ftyp box for MIME/extension acceptance in Ops UI. */
const TINY_MP4 = Buffer.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00,
  0x00, 0x00, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x6d, 0x70, 0x34, 0x31,
]);

test.describe("ops product media architecture", () => {
  test("image + video lifecycle on temporary draft, then archive with public=0", async ({
    page,
    request,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    test.skip(
      !email || !password,
      "Set HAMD_OPS_E2E_EMAIL and HAMD_OPS_E2E_PASSWORD to run live ops media checks.",
    );
    test.setTimeout(240_000);

    const stamp = Date.now();
    const slug = `media-arch-${stamp}`;
    const name = `Media Arch ${stamp}`;

    await loginOps(page);
    await page.goto("/products");
    await expect(
      page.getByRole("heading", { name: /create product|edit product/i }),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByLabel(/^Name$/i).fill(name);
    await page.getByLabel(/^Slug$/i).fill(slug);
    await page.getByLabel(/^Description$/i).fill(
      "Temporary media architecture test product. Not a production SKU.",
    );
    const category = page.getByLabel(/^Category$/i);
    const options = category.locator("option");
    if ((await options.count()) > 1) {
      await category.selectOption({ index: 1 });
    }
    await page.getByRole("button", { name: /create draft/i }).click();
    await expect(page.getByRole("status")).toContainText(/draft/i, {
      timeout: 20_000,
    });

    await expect(page.getByRole("heading", { name: /^Media$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Images$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Videos$/i })).toBeVisible();

    await page
      .getByLabel(/^Upload image$/i)
      .setInputFiles({
        name: "hero.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      });
    await expect(page.getByRole("status")).toContainText(/uploaded|saved|image/i, {
      timeout: 30_000,
    });
    await expect(page.locator(".hamd-ops-gallery__item img")).toHaveCount(1, {
      timeout: 20_000,
    });

    await page
      .getByLabel(/^Upload video \(MP4\)$/i)
      .setInputFiles({
        name: "clip.mp4",
        mimeType: "video/mp4",
        buffer: TINY_MP4,
      });
    await expect(page.getByRole("status")).toContainText(/video/i, {
      timeout: 60_000,
    });
    await expect(page.locator(".hamd-ops-gallery--videos video")).toHaveCount(1, {
      timeout: 20_000,
    });

    // Draft media must not appear on the public catalogue.
    const publicList = await request.get(
      `${apiBase}/api/v1/products?q=${encodeURIComponent(name)}`,
    );
    expect(publicList.ok()).toBeTruthy();
    const listBody = (await publicList.json()) as {
      data?: Array<{ slug?: string }>;
    };
    expect(
      (listBody.data ?? []).some((row) => row.slug === slug),
    ).toBeFalsy();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /^Archive$/i }).click();
    await expect(page.getByRole("status")).toContainText(/archived/i, {
      timeout: 20_000,
    });

    const catalog = await request.get(`${apiBase}/api/v1/products?pageSize=100`);
    expect(catalog.ok()).toBeTruthy();
    const catalogBody = (await catalog.json()) as {
      data?: Array<{ slug?: string; name?: string }>;
    };
    const leaked = (catalogBody.data ?? []).filter(
      (row) =>
        row.slug?.startsWith("media-arch-") ||
        row.name?.startsWith("Media Arch "),
    );
    expect(leaked).toEqual([]);
  });

  test("buyer cannot open ops products media management", async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    const buyerEmail = process.env.HAMD_BUYER_E2E_EMAIL ?? "";
    const buyerPassword = process.env.HAMD_BUYER_E2E_PASSWORD ?? "";
    test.skip(
      !buyerEmail || !buyerPassword,
      "Set HAMD_BUYER_E2E_EMAIL and HAMD_BUYER_E2E_PASSWORD for buyer auth checks.",
    );

    const page = await browser.newPage();
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(buyerEmail);
    await page.getByLabel(/password/i).fill(buyerPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: /^Media$/i })).toHaveCount(0);
    await page.close();
  });
});
