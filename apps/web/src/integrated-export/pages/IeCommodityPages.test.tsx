import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../commodities/use-published-ie-catalogue.js", () => ({
  usePublishedIeCommodities: () => ({
    previews: [],
    commodities: [],
    source: "api",
    loading: false,
    error: null,
    retry: () => undefined,
  }),
  usePublishedIeCommodity: () => ({
    commodity: null,
    source: "api",
  }),
}));

import { AppProviders } from "../../app/providers/AppProviders.js";
import { IntegratedExportLayout } from "../IntegratedExportLayout.js";
import {
  getIeCommodityPreviews,
  IE_COMMODITY_RECORDS,
  type IeCommodity,
} from "../commodities/index.js";
import { IeCommodityCard } from "../IeCommodityCard.js";
import { IeCommoditiesPage } from "./IeCommoditiesPage.js";
import { IeCommodityDetailPage } from "./IeCommodityDetailPage.js";
import { IeCommodityDetailView } from "./IeCommodityDetailView.js";

/** TEST FIXTURE - not production catalogue data. */
const FIXTURE_MINIMAL: IeCommodity = {
  id: "ie3b-test-minimal",
  slug: "fixture-view-minimal",
  name: "Fixture View Minimal",
  published: true,
};

/** TEST FIXTURE - not production catalogue data. */
const FIXTURE_WITH_SPECS: IeCommodity = {
  id: "ie3b-test-specs",
  slug: "fixture-view-specs",
  name: "Fixture View Specs",
  published: true,
  category: "Test category",
  shortDescription: "Short fixture lead.",
  description: "Longer fixture overview copy.",
  specifications: [{ label: "Approved label", value: "Approved value" }],
};

/** TEST FIXTURE - gallery layout only. */
const FIXTURE_WITH_GALLERY: IeCommodity = {
  id: "ie3b-test-gallery",
  slug: "fixture-view-gallery",
  name: "Fixture View Gallery",
  published: true,
  gallery: [
    { src: "/api/v1/public/catalog-media/fixture/one.jpg", alt: "Fixture gallery one" },
    { src: "/api/v1/public/catalog-media/fixture/two.jpg", alt: "Fixture gallery two" },
  ],
};

/** TEST FIXTURE - unpublished must never appear publicly. */
const FIXTURE_DRAFT: IeCommodity = {
  id: "ie3b-test-draft",
  slug: "fixture-view-draft",
  name: "Fixture View Draft",
  published: false,
};

function renderCatalogue() {
  return render(
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
}

describe("IE-3B catalogue and detail UI", () => {
  it("renders a polished empty catalogue without prices or fake stock", () => {
    expect(IE_COMMODITY_RECORDS).toHaveLength(0);
    expect(getIeCommodityPreviews()).toHaveLength(0);
    renderCatalogue();
    expect(
      screen.getByRole("heading", { level: 1, name: /explore our commodities/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /no commodities published yet/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sesame Seeds" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cashew" })).not.toBeInTheDocument();
    expect(screen.queryByText(/add to cart/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/in stock/i)).not.toBeInTheDocument();
    const quoteLinks = screen.getAllByRole("link", { name: /^Request a Quote$/i });
    expect(
      quoteLinks        .some(
          (el) =>
            el.getAttribute("href") ===
            `/login?returnTo=${encodeURIComponent("/app/requests/new?lob=integrated_export")}`,
        ),
    ).toBe(true);
  });

  it("handles unknown slug safely with request CTA", () => {
    render(
      <MemoryRouter
        initialEntries={["/businesses/almahbub-integrated-export/commodities/example"]}
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
    expect(
      screen.getByRole("heading", { name: /commodity information is being updated/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/in stock/i)).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /^Request a Quote$/i })
        .some(
          (el) =>
            el.getAttribute("href") ===
            `/login?returnTo=${encodeURIComponent("/app/requests/new?lob=integrated_export")}`,
        ),
    ).toBe(true);
  });

  it("treats unpublished commodity slugs as empty, not as a public catalogue", () => {
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
    expect(
      screen.getByRole("heading", { name: /commodity information is being updated/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Sesame Seeds" })).not.toBeInTheDocument();
    expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
    expect(screen.queryByText(/add to cart/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not Almahbub facilities/i)).not.toBeInTheDocument();
  });

  it("card renders only present fields and uses media placeholder when needed", () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <IeCommodityCard
            commodity={{
              slug: FIXTURE_MINIMAL.slug,
              name: FIXTURE_MINIMAL.name,
              imageSrc: null,
            }}
          />
        </AppProviders>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: FIXTURE_MINIMAL.name })).toBeInTheDocument();
    expect(screen.queryByText(/test category/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view commodity/i })).toHaveAttribute(
      "href",
      `/businesses/almahbub-integrated-export/commodities/${FIXTURE_MINIMAL.slug}`,
    );
    expect(document.querySelector(".hamd-aie-media-placeholder")).toBeTruthy();
  });

  it("detail view uses placeholder without inventing specs or markets", () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <IeCommodityDetailView commodity={FIXTURE_MINIMAL} />
        </AppProviders>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: FIXTURE_MINIMAL.name }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /approved imagery forthcoming/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /specifications/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /additional details/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/nigeria/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Request Export Supply$/i })).toHaveAttribute(
      "href",
      `/login?returnTo=${encodeURIComponent(`/app/requests/new?ieCommodity=${encodeURIComponent(FIXTURE_MINIMAL.slug)}`)}`,
    );
  });

  it("detail view shows provided sections only", () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <IeCommodityDetailView commodity={FIXTURE_WITH_SPECS} />
        </AppProviders>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /additional details/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /specifications/i })).toBeInTheDocument();
    expect(screen.getByText("Approved label")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /packaging/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^markets$/i })).not.toBeInTheDocument();
    expect(screen.getByText(/test category/i)).toBeInTheDocument();
  });

  it("detail gallery uses shared constrained tiles", () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <IeCommodityDetailView commodity={FIXTURE_WITH_GALLERY} />
        </AppProviders>
      </MemoryRouter>,
    );
    expect(document.querySelector(".hamd-aie-commodity-detail__gallery")).toBeTruthy();
    expect(document.querySelectorAll(".hamd-aie-commodity-detail__gallery-tile")).toHaveLength(2);
    expect(screen.getByRole("img", { name: "Fixture gallery one" })).toBeInTheDocument();
  });

  it("unpublished fixture never appears in public preview helpers", () => {
    const records = [FIXTURE_MINIMAL, FIXTURE_DRAFT] as const;
    const previews = getIeCommodityPreviews(records);
    expect(previews.map((item) => item.slug)).toEqual([FIXTURE_MINIMAL.slug]);
    expect(previews.some((item) => item.slug === FIXTURE_DRAFT.slug)).toBe(false);
  });
});
