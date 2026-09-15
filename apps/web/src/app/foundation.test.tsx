import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { App } from "../App.js";
import { AppProviders } from "../app/providers/AppProviders.js";
import { applyPageSeo } from "../lib/seo.js";
import { PUBLIC_NAV } from "../lib/routes.js";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <App />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("public website foundation", () => {
  it("applies SEO metadata for a page", () => {
    applyPageSeo({
      title: "About",
      description: "Company overview",
      path: "/about",
    });
    expect(document.title).toMatch(/About/);
    expect(
      document.head.querySelector('meta[name="description"]')?.getAttribute("content"),
    ).toBe("Company overview");
    expect(
      document.head.querySelector('meta[property="og:url"]')?.getAttribute("content"),
    ).toMatch(/\/about$/);
  });

  it(
    "routes primary public pages",
    async () => {
      renderAt("/about");
      expect(
        await screen.findByRole(
          "heading",
          {
            name: /about almahbub international/i,
          },
          { timeout: 30_000 },
        ),
      ).toBeInTheDocument();
    },
    40_000,
  );

  it("renders product detail by slug", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/v1/products/industrial-components")) {
          return new Response(
            JSON.stringify({
              data: {
                slug: "industrial-components",
                name: "Industrial components",
                description: "Spec-driven industrial parts.",
                category: { slug: "machineries", name: "Machineries" },
                brandName: null,
                manufacturerName: null,
                images: [],
                videos: [],
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      }),
    );
    renderAt("/product/industrial-components");
    expect(
      await screen.findByRole(
        "heading",
        { name: /industrial components/i },
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument();
    vi.unstubAllGlobals();
  }, 20_000);

  it("renders 404 for unknown paths", async () => {
    renderAt("/does-not-exist");
    expect(
      await screen.findByRole(
        "heading",
        { name: /page not found/i },
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument();
  }, 20_000);

  it("exposes production nav destinations", () => {
    expect(PUBLIC_NAV.map((item) => item.href)).toEqual([
      "/about",
      "/services",
      "/products",
      "/industries",
      "/faq",
      "/contact",
    ]);
  });
});

describe("alias redirects", () => {
  it("redirects /request to contact intake", async () => {
    renderAt("/request");
    expect(
      await screen.findByRole(
        "heading",
        {
          name: /talk to a procurement specialist/i,
        },
        { timeout: 30_000 },
      ),
    ).toBeInTheDocument();
  }, 40_000);
});
