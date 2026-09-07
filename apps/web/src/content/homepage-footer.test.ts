import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { homepageFooter } from "./homepage.js";

const DEAD_FOOTER_HREFS = [
  "/track",
  "/catalog/categories",
  "/catalog#featured-products",
  "/industries/energy",
  "/industries/manufacturing",
  "/industries/construction",
  "/industries/healthcare",
  "/industries/mining",
  "/procurement-services",
  "/global-sourcing",
  "/help",
  "/knowledge",
  "/case-studies",
  "/supplier-network",
] as const;

const LIVE_INTERNAL_PREFIXES = [
  "/",
  "/about",
  "/group",
  "/products",
  "/industries",
  "/services",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/cookies",
  "/login",
  "/newsletter",
  "/businesses/almahbub-international",
  "/businesses/almahbub-integrated-export",
] as const;

function collectFooterHrefs(): string[] {
  const groups = [
    homepageFooter.businessLinks,
    homepageFooter.companyLinks,
    homepageFooter.productLinks,
    homepageFooter.industryLinks,
    homepageFooter.serviceLinks,
    homepageFooter.supportLinks,
    homepageFooter.resourceLinks,
    homepageFooter.legalLinks,
  ];
  const hrefs: string[] = [];
  for (const group of groups) {
    for (const link of group ?? []) {
      hrefs.push(link.href);
    }
  }
  if (homepageFooter.brandHref) hrefs.push(homepageFooter.brandHref);
  if (homepageFooter.groupHref) hrefs.push(homepageFooter.groupHref);
  if (homepageFooter.contact?.href) hrefs.push(homepageFooter.contact.href);
  for (const office of homepageFooter.offices ?? []) {
    if (office.href) hrefs.push(office.href);
  }
  return hrefs;
}

function pathOnly(href: string): string {
  return href.split("#")[0] ?? href;
}

describe("homepage footer destinations", () => {
  it("keeps Integrated Export on the dedicated portal path", () => {
    const ie = homepageFooter.businessLinks?.find((link) => link.id === "integrated-export");
    expect(ie?.href).toBe("/businesses/almahbub-integrated-export");
    expect(ie?.summary).toMatch(/agro commodities/i);
  });

  it("uses only live internal destinations", () => {
    const hrefs = collectFooterHrefs();
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href, "footer href must not be empty").toBeTruthy();
      const path = pathOnly(href);
      expect(DEAD_FOOTER_HREFS, href).not.toContain(path);
      if (path.startsWith("mailto:") || path.startsWith("tel:") || path.startsWith("http")) {
        continue;
      }
      expect(
        LIVE_INTERNAL_PREFIXES.includes(path as (typeof LIVE_INTERNAL_PREFIXES)[number]),
        `unexpected footer href ${href}`,
      ).toBe(true);
    }
  });

  it("does not reintroduce dead footer hrefs in public web source", () => {
    const root = dirname(fileURLToPath(import.meta.url));
    const webSrc = join(root, "..");
    const files = [
      join(webSrc, "content/homepage.ts"),
      join(webSrc, "app/RootLayout.tsx"),
      join(webSrc, "integrated-export/IntegratedExportPortalPage.tsx"),
    ];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const dead of DEAD_FOOTER_HREFS) {
        expect(text.includes(`"${dead}"`) || text.includes(`'${dead}'`), `${file} ${dead}`).toBe(
          false,
        );
      }
    }
  });
});
