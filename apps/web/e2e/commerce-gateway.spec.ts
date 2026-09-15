import { expect, test } from "@playwright/test";
const international = "/businesses/almahbub-international";
const ie = "/businesses/almahbub-integrated-export";
const categories = [
  ["iphones-gadgets", "Electronics and gadgets"],
  ["medical-equipments", "Medical and healthcare equipment"],
  ["home-garden-wares", "Home, garden and facilities"],
  ["machineries", "Machinery and industrial"],
  ["general-procurement", "General procurement"],
  ["home-appliances", "Home appliances"],
  ["office-business", "Office and business"],
  ["fashion-textiles", "Fashion and textiles"],
  ["beauty-spa-salon", "Beauty, spa and salon"],
  ["retail-store-setup", "Retail and store setup"],
].map(([slug, name]) => ({
  slug,
  name,
  imageUrl: "/media/category-industrial.svg",
}));
const commodities = [
  "Sesame Seeds",
  "Cashew",
  "Ginger",
  "Hibiscus",
  "Shea",
  "Soybean",
  "Cocoa",
].map((name, i) => {
  const slug = name.toLowerCase().replaceAll(" ", "-");
  return {
    id: slug,
    slug,
    name,
    published: true,
    sortOrder: i,
    heroMedia: {
      src: `/media/ie/commodities/${slug}/hero/ie-${slug}-hero-01.webp`,
      alt: name,
    },
    shortDescription: "Buyer commodity information",
    description: "Additional buyer information",
    specifications: [{ label: "Grade", value: "Confirm with quotation" }],
    gallery: [],
  };
});
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/categories"))
      return route.fulfill({
        json: { data: categories, meta: { total: categories.length } },
      });
    if (path.includes("/integrated-export/commodities/"))
      return route.fulfill({
        json: { data: commodities.find((c) => path.endsWith(c.slug)) },
      });
    if (path.endsWith("/integrated-export/commodities"))
      return route.fulfill({ json: { data: commodities } });
    if (path.includes("/products/"))
      return route.fulfill({
        json: {
          data: {
            slug: "sample-machine",
            name: "Sample machine",
            description: "Machinery sourcing",
            category: categories[3],
            images: [],
            variants: [
              {
                name: "Standard sourcing",
                unit: "unit",
                typicalSpecificationFields: ["capacity"],
                sourcingStatus: null,
              },
            ],
          },
        },
      });
    if (path.endsWith("/wedding/campaign"))
      return route.fulfill({ json: { data: null } });
    if (path.includes("/auth/"))
      return route.fulfill({
        status: 401,
        json: { error: { message: "Sign in required" } },
      });
    return route.fulfill({ json: { data: [], meta: { total: 0 } } });
  });
});
for (const width of [320, 390, 768, 1280]) {
  test(`gateway and business discovery fit ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Commerce Across Borders.",
    );
    await expect(
      page
        .getByRole("list", { name: "International categories" })
        .locator("li"),
    ).toHaveCount(10);
    await expect(
      page
        .getByRole("list", { name: "Integrated Export commodities" })
        .locator("li"),
    ).toHaveCount(7);
    expect(
      await page
        .locator("main > section")
        .evaluateAll((nodes) => nodes.map((n) => n.id)),
    ).toEqual(["", "international", "integrated-export", ""]);
    await expect(page.locator('a[href="/group"]')).toHaveCount(0);
    for (const path of [
      "/",
      international,
      ie,
      `${ie}/commodities/sesame-seeds`,
      "/product/sample-machine",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        path,
      ).toBe(true);
      if (path === "/") {
        const essential = page.getByRole("button", {
          name: "Essential only",
          exact: true,
        });
        if (await essential.isVisible()) await essential.click();
        const images = page.locator("#integrated-export img");
        await expect(images).toHaveCount(7);
        for (const img of await images.all()) {
          await img.scrollIntoViewIfNeeded();
          await img.evaluate(el => (el as HTMLImageElement).decode());
          await expect
            .poll(() =>
              img.evaluate((el) => (el as HTMLImageElement).naturalWidth),
            )
            .toBeGreaterThan(0);
        }
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.screenshot({
          path: testInfo.outputPath(`homepage-${width}.png`),
          fullPage: true,
        });
      }
    }
  });
}
test("saved group links redirect and direct catalogue paths resolve", async ({
  page,
}) => {
  for (const path of ["/group", "/group/", "/businesses"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Commerce Across Borders.",
    );
  }
  await page
    .getByRole("list", { name: "International categories" })
    .getByRole("link")
    .first()
    .click();
  await expect(page).toHaveURL(/\/products\?category=iphones-gadgets/);
  await page.goto("/");
  await page
    .getByRole("list", { name: "Integrated Export commodities" })
    .getByRole("link")
    .first()
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Sesame Seeds" }),
  ).toBeVisible();
  const headings = await page.locator("main h2").allTextContents();
  expect(headings.indexOf("Specifications")).toBeLessThan(
    headings.indexOf("Additional details"),
  );
});

test("catalogue outages retain both operations and can be retried", async ({ page }) => {
  let unavailable = true;
  await page.route("**/api/v1/categories?**", route => unavailable ? route.fulfill({ status: 400, json: { error: { message: "Unavailable" } } }) : route.fulfill({ json: { data: categories } }));
  await page.route("**/api/v1/integrated-export/commodities?**", route => unavailable ? route.fulfill({ status: 503, json: { error: { message: "Unavailable" } } }) : route.fulfill({ json: { data: commodities } }));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Retry categories" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry commodities" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore International" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore Integrated Export" })).toBeVisible();
  unavailable = false;
  await page.getByRole("button", { name: "Retry categories" }).click();
  await page.getByRole("button", { name: "Retry commodities" }).click();
  await expect(page.getByRole("list", { name: "International categories" }).locator("li")).toHaveCount(10);
  await expect(page.getByRole("list", { name: "Integrated Export commodities" }).locator("li")).toHaveCount(7);
});

test("both operations remain readable in dark mode", async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("main").getByRole("heading", { name: "Almahbub International", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Almahbub Integrated Export", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("homepage-dark.png"), fullPage: true });
});
