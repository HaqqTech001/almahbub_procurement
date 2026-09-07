import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppProviders } from "../../app/providers/AppProviders.js";
import { IntegratedExportLayout } from "../IntegratedExportLayout.js";
import { mapApiCommodityToIeCommodity } from "./map-ie-commodity.js";
import type { IeCommodityApiDetail } from "./ie-commodity-api.js";
import { IeCommoditiesPage } from "../pages/IeCommoditiesPage.js";
import { IeCommodityDetailPage } from "../pages/IeCommodityDetailPage.js";

const API_HERO = {
  src: "/media/ie/commodities/sesame-seeds/hero/ie-sesame-seeds-hero-01.webp",
  alt: "API sesame seeds hero alt",
};

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? "application/json" : null,
    },
    text: async () => JSON.stringify({ success: true, data }),
  } as Response;
}

describe("mapApiCommodityToIeCommodity", () => {
  it("maps heroMedia and omits null commercial fields", () => {
    const dto: IeCommodityApiDetail = {
      id: "0190c8a0-1000-7000-8000-00000000e001",
      slug: "sesame-seeds",
      name: "Sesame Seeds",
      published: true,
      category: "Oilseeds",
      shortDescription: "Enquiry-led oilseed.",
      description: "Full copy.",
      heroMedia: API_HERO,
      gallery: [],
      specifications: [],
      packaging: "Confirmed per enquiry.",
      qualityInformation: "Confirmed per enquiry.",
      applications: ["Edible oil extraction"],
      markets: null,
      sortOrder: 10,
    };
    const mapped = mapApiCommodityToIeCommodity(dto);
    expect(mapped.heroMedia).toEqual(API_HERO);
    expect(mapped).not.toHaveProperty("markets");
    expect(mapped).not.toHaveProperty("specifications");
    expect(mapped).not.toHaveProperty("price");
    expect(JSON.stringify(mapped)).not.toMatch(/"sku"/);
  });

  it("keeps heroMedia src and falls back alt from the commodity name", () => {
    const mapped = mapApiCommodityToIeCommodity({
      id: "x",
      slug: "cashew",
      name: "Cashew",
      published: true,
      category: null,
      shortDescription: null,
      heroMedia: { src: "/media/ie/commodities/cashew/hero/ie-cashew-hero-01.webp", alt: "   " },
      sortOrder: 20,
    });
    expect(mapped.heroMedia).toEqual({
      src: "/media/ie/commodities/cashew/hero/ie-cashew-hero-01.webp",
      alt: "Cashew",
    });
  });
});

describe("IE catalogue prefers public API media", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("replaces the static snapshot with API heroMedia when the list endpoint succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse([
          {
            id: "0190c8a0-1000-7000-8000-00000000e001",
            slug: "sesame-seeds",
            name: "Sesame Seeds",
            published: true,
            category: "Oilseeds",
            shortDescription: "API short copy",
            heroMedia: API_HERO,
            sortOrder: 10,
          },
        ]),
      ),
    );

    render(
      <MemoryRouter initialEntries={["/businesses/almahbub-integrated-export/commodities"]}>
        <AppProviders>
          <Routes>
            <Route
              path="/businesses/almahbub-integrated-export"
              element={<IntegratedExportLayout />}
            >
              <Route path="commodities" element={<IeCommoditiesPage />} />
            </Route>
          </Routes>
        </AppProviders>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(document.querySelector("[data-ie-catalogue-source='api']")).toBeTruthy();
    });
    const hero = screen.getByRole("img", { name: API_HERO.alt });
    expect(hero).toHaveAttribute("src", API_HERO.src);
    expect(hero).toHaveAttribute("data-ie-hero", "true");
    expect(screen.queryByRole("link", { name: "Cashew", exact: true })).not.toBeInTheDocument();
  });

  it("renders API detail heroMedia for a published slug", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          id: "0190c8a0-1000-7000-8000-00000000e001",
          slug: "sesame-seeds",
          name: "Sesame Seeds",
          published: true,
          category: "Oilseeds",
          shortDescription: "API short copy",
          description: "API long copy",
          heroMedia: API_HERO,
          gallery: [],
          specifications: [],
          packaging: null,
          qualityInformation: null,
          applications: [],
          markets: null,
          sortOrder: 10,
        }),
      ),
    );

    render(
      <MemoryRouter
        initialEntries={["/businesses/almahbub-integrated-export/commodities/sesame-seeds"]}
      >
        <AppProviders>
          <Routes>
            <Route
              path="/businesses/almahbub-integrated-export"
              element={<IntegratedExportLayout />}
            >
              <Route path="commodities/:slug" element={<IeCommodityDetailPage />} />
            </Route>
          </Routes>
        </AppProviders>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(document.querySelector("[data-ie-catalogue-source='api']")).toBeTruthy();
    });
    expect(screen.getByRole("img", { name: API_HERO.alt })).toHaveAttribute("src", API_HERO.src);
    expect(screen.queryByText(/not Almahbub facilities/i)).not.toBeInTheDocument();
  });
});
