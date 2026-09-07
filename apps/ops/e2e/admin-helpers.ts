import { expect, type Page } from "@playwright/test";

export const opsEmail = process.env.HAMD_OPS_E2E_EMAIL ?? "";
export const opsPassword = process.env.HAMD_OPS_E2E_PASSWORD ?? "";
export const buyerEmail = process.env.HAMD_BUYER_E2E_EMAIL ?? "";
export const buyerPassword = process.env.HAMD_BUYER_E2E_PASSWORD ?? "";

export async function dismissOpsCampaign(page: Page) {
  const continueButton = page.getByRole("button", { name: /continue to console/i });
  try {
    await continueButton.waitFor({ state: "visible", timeout: 4_000 });
    await continueButton.click();
    await expect(continueButton).toHaveCount(0);
  } catch {
    /* no active campaign overlay */
  }
}

export async function waitForAdminShell(page: Page) {
  await expect(page).not.toHaveURL(/\/unauthorized(\?|$)/, { timeout: 15_000 });
  await dismissOpsCampaign(page);
  await expect(page.locator(".hamd-admin-shell")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText(/admin console/i).first()).toBeVisible();
}

export async function loginOps(
  page: Page,
  email = opsEmail,
  password = opsPassword,
) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.locator('input[type="password"][name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
  if (/\/unauthorized(\?|$)/.test(new URL(page.url()).pathname)) {
    throw new Error(
      "HAMD_OPS_E2E_EMAIL authenticated but lacks ops:access. Grant ops_admin explicitly; do not use a buyer account.",
    );
  }
  await waitForAdminShell(page);
}

export async function openAdminNav(page: Page, name: RegExp) {
  const openMenu = page.getByRole("button", { name: /open menu/i }).first();
  const adminNav = page.getByRole("navigation", { name: /^admin$/i });
  if (await openMenu.isVisible()) {
    await openMenu.click();
    await expect(adminNav).toBeVisible({ timeout: 10_000 });
    await adminNav.getByRole("link", { name }).click();
    return;
  }
  await adminNav.getByRole("link", { name }).click();
}
