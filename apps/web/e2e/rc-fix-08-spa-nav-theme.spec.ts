import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const evidenceDir = path.join(__dirname, "evidence", "rc-fix-08");
const apiBase = process.env.HAMD_API_URL ?? "http://127.0.0.1:4000";
const terminalsDir =
  process.env.CURSOR_TERMINALS_DIR ??
  "C:\\Users\\USER\\.cursor\\projects\\c-Users-USER-Downloads-almahbub-procurement-almahbub-procurement\\terminals";

async function dismissOverlays(page: Page, theme: "light" | "dark" = "light") {
  await page.addInitScript((initialTheme) => {
    window.localStorage.setItem(
      "hamd.web.guidance.preference",
      JSON.stringify({
        mode: "off",
        neverAutoStart: true,
        welcomeCompletedAt: "2026-01-01T00:00:00.000Z",
        locale: "en",
        suppressedTourKeys: [],
      }),
    );
    window.localStorage.setItem("hamd.web.cookie-consent", "essential");
    /* Only seed theme when unset so later dark-mode assertions persist across reloads. */
    if (!window.localStorage.getItem("hamd.web.theme")) {
      window.localStorage.setItem("hamd.web.theme", initialTheme);
    }
  }, theme);
}

function readOtpFromApiLogs(email: string): string | null {
  if (!fs.existsSync(terminalsDir)) return null;
  const files = fs
    .readdirSync(terminalsDir)
    .filter((name) => name.endsWith(".txt"))
    .map((name) => path.join(terminalsDir, name));
  let haystack = "";
  for (const file of files) {
    try {
      haystack += fs.readFileSync(file, "utf8");
      haystack += "\n";
    } catch {
      /* ignore */
    }
  }
  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = haystack.match(
    new RegExp(
      `\\[auth-email\\] to=${escaped}[\\s\\S]{0,400}?Verification code: (\\d{6})`,
      "i",
    ),
  );
  return match?.[1] ?? null;
}

async function waitForOtp(email: string, timeoutMs = 20_000): Promise<string> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const otp = readOtpFromApiLogs(email);
    if (otp) return otp;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`OTP not found in API logs for ${email}`);
}

async function provisionUser(): Promise<{ email: string; password: string }> {
  const stamp = Date.now();
  const email = `rcfix08.${stamp}@example.com`;
  const password = `RcFix08!${stamp}`;

  let register: Response | null = null;
  let lastError = "";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    register = await fetch(`${apiBase}/api/v1/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        firstName: "RC",
        lastName: "Fix",
        email,
        password,
        companyName: "RC Fix Co",
        agreeToTerms: true,
      }),
    });
    if (register.ok) break;
    lastError = `${register.status} ${await register.text()}`;
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  if (!register?.ok) {
    throw new Error(`register failed: ${lastError}`);
  }

  const otp = await waitForOtp(email);
  const verify = await fetch(`${apiBase}/api/v1/auth/otp/verify`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email, code: otp }),
  });
  if (!verify.ok) {
    throw new Error(`otp verify failed: ${verify.status} ${await verify.text()}`);
  }

  return { email, password };
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByLabel(/^email/i).fill(email);
  await page.getByLabel(/^password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/app\/?$/, { timeout: 60_000 });
}

async function assertNotStuckOnSkeleton(page: Page) {
  await expect(page.locator(".hamd-auth-boot")).toHaveCount(0, {
    timeout: 20_000,
  });
  await expect(page.locator(".hamd-web-host-loading")).toHaveCount(0, {
    timeout: 45_000,
  });
}

async function spaNavigate(page: Page, href: string, expectTitle: RegExp) {
  const before = page.url();
  const desktopLink = page.locator(
    `.hamd-client-shell__sidebar a.hamd-client-shell__nav-link[href="${href}"]`,
  );
  const drawerLink = page.locator(
    `.hamd-client-shell__drawer a.hamd-client-shell__nav-link[href="${href}"], [role="dialog"] a.hamd-client-shell__nav-link[href="${href}"]`,
  );

  if (await desktopLink.isVisible().catch(() => false)) {
    await desktopLink.click();
  } else {
    const openMenu = page.getByRole("button", { name: /open menu/i });
    await openMenu.click();
    await drawerLink.first().click({ timeout: 15_000 });
  }

  await expect(page).toHaveURL(new RegExp(`${href.replace(/\//g, "\\/")}\\/?$`));
  expect(page.url()).not.toBe(before);
  await assertNotStuckOnSkeleton(page);
  await expect(
    page.locator(".hamd-client-shell__page-title, h1").first(),
  ).toContainText(expectTitle);
}

test.describe("RC-FIX-08 SPA nav + theme", () => {
  test.setTimeout(240_000);

  test("authenticated SPA navigation never sticks on skeleton", async ({
    page,
    context,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop");
    fs.mkdirSync(evidenceDir, { recursive: true });
    await context.clearCookies();
    await dismissOverlays(page);

    const creds = await provisionUser();
    await login(page, creds.email, creds.password);
    await expect(page.getByText(/welcome back/i)).toBeVisible({
      timeout: 30_000,
    });
    await page.screenshot({
      path: path.join(evidenceDir, "01-dashboard-light.png"),
      fullPage: true,
    });

    const routes: Array<{ href: string; title: RegExp }> = [
      { href: "/app/requests", title: /requests/i },
      { href: "/app/quotations", title: /quotation/i },
      { href: "/app/shipments", title: /shipment/i },
      { href: "/app/notifications", title: /notification/i },
      { href: "/app/profile", title: /profile/i },
      { href: "/app/settings", title: /settings|account/i },
      { href: "/app", title: /welcome|dashboard/i },
    ];

    for (const route of routes) {
      await spaNavigate(page, route.href, route.title);
    }

    await page.reload({ waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/app\/?$/);
    await assertNotStuckOnSkeleton(page);
    await spaNavigate(page, "/app/requests", /requests/i);
    await spaNavigate(page, "/app/quotations", /quotation/i);

    /* Switch theme via the shell control (source of truth: ThemeProvider + localStorage). */
    await page.getByRole("switch", { name: /switch to dark theme/i }).click();
    await expect
      .poll(async () => page.locator("html").getAttribute("data-theme"), {
        timeout: 10_000,
      })
      .toBe("dark");
    await expect
      .poll(async () =>
        page.evaluate(() => window.localStorage.getItem("hamd.web.theme")),
      )
      .toBe("dark");

    await spaNavigate(page, "/app/requests", /requests/i);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.screenshot({
      path: path.join(evidenceDir, "02-requests-dark.png"),
      fullPage: true,
    });

    await spaNavigate(page, "/app/settings", /settings|account/i);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByLabel(/^email/i).fill(creds.email);
    await page.getByLabel(/^password/i).fill(creds.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 60_000 });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.screenshot({
      path: path.join(evidenceDir, "03-dashboard-dark.png"),
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await spaNavigate(page, "/app/requests", /requests/i);
    await page.screenshot({
      path: path.join(evidenceDir, "04-requests-mobile-dark.png"),
      fullPage: true,
    });
  });
});
