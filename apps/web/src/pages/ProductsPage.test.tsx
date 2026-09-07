import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AppProviders } from "../app/providers/AppProviders.js";
import { ProductsPage } from "./ProductsPage.js";
import { ProductDetailPage } from "./ProductDetailPage.js";

const optionalAuthState = vi.hoisted(() => ({
  status: "anonymous" as "anonymous" | "authenticated",
}));

vi.mock("../auth/session/AuthProvider.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../auth/session/AuthProvider.js")>();
  return {
    ...actual,
    useOptionalAuth: () => ({ status: optionalAuthState.status }),
  };
});

const published = {
  slug: "hospital-beds",
  name: "Hospital Beds",
  description: "Electric hospital beds for ward use.",
  category: { slug: "medical-equipments", name: "Medical Equipments" },
  brandName: null,
  manufacturerName: null,
  images: [],
  videos: [],
  variants: [
    {
      name: "Standard sourcing",
      unit: "unit",
      typicalSpecificationFields: ["bed type", "quantity"],
      sourcingStatus: "available_for_procurement",
    },
  ],
};

function envelope<T>(data: T, meta?: object) {
  return {
    success: true,
    data,
    meta: { page: 1, pageSize: 24, total: Array.isArray(data) ? data.length : 0, hasMore: false, ...meta },
  };
}

afterEach(() => {
  optionalAuthState.status = "anonymous";
  vi.unstubAllGlobals();
});

function mockCatalog(options: {
  products?: unknown[];
  categories?: unknown[];
  product?: unknown;
  productStatus?: number;
  listStatus?: number;
}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/categories")) {
        return new Response(
          JSON.stringify(envelope(options.categories ?? [])),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (/\/api\/v1\/products\/[^?]+/.test(url) && !url.includes("?")) {
        const status = options.productStatus ?? 200;
        return new Response(
          JSON.stringify(
            status === 200
              ? envelope(options.product ?? published)
              : { error: { code: "NOT_FOUND", message: "Product not found." } },
          ),
          { status, headers: { "Content-Type": "application/json" } },
        );
      }
      if (url.includes("/api/v1/products")) {
        const status = options.listStatus ?? 200;
        return new Response(
          JSON.stringify(
            status === 200
              ? envelope(options.products ?? [])
              : {
                  error: {
                    code: status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR",
                    message: "Unable to load products.",
                  },
                },
          ),
          { status, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response("{}", { status: 404 });
    }),
  );
}

describe("public products page", () => {
  it("loads an empty catalogue with a procurement empty state", async () => {
    mockCatalog({
      products: [],
      categories: [{ slug: "machineries", name: "Machineries" }],
    });
    render(
      <MemoryRouter initialEntries={["/products"]}>
        <AppProviders>
          <ProductsPage />
        </AppProviders>
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: /published products will appear here/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^products$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/search products/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /browse by category/i })).not.toBeInTheDocument();
  });

  it("does not place category discovery cards above the product grid", async () => {
    mockCatalog({ products: [], categories: [] });
    render(
      <MemoryRouter initialEntries={["/products"]}>
        <AppProviders>
          <ProductsPage />
        </AppProviders>
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: /^products$/i });
    expect(document.querySelector(".hamd-catalog-category-grid")).toBeNull();
  });

  it("filters by category in the URL", async () => {
    mockCatalog({
      products: [published],
      categories: [{ slug: "medical-equipments", name: "Medical Equipments" }],
    });
    render(
      <MemoryRouter initialEntries={["/products?category=medical-equipments"]}>
        <AppProviders>
          <ProductsPage />
        </AppProviders>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: /hospital beds/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /hospital beds/i })).toHaveAttribute(
      "href",
      "/product/hospital-beds",
    );
    expect(screen.queryByText(/electric hospital beds for ward use/i)).not.toBeInTheDocument();
  });

  it("shows an error when the catalogue API fails", async () => {
    mockCatalog({ listStatus: 500, products: [] });
    render(
      <MemoryRouter initialEntries={["/products"]}>
        <AppProviders>
          <ProductsPage />
        </AppProviders>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: /unable to load products/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("does not wait on a private session before listing public products", async () => {
    mockCatalog({
      products: [published],
      categories: [{ slug: "medical-equipments", name: "Medical Equipments" }],
    });
    render(
      <MemoryRouter initialEntries={["/products"]}>
        <AppProviders>
          <ProductsPage />
        </AppProviders>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: /hospital beds/i })).toBeInTheDocument();
    const urls = vi.mocked(fetch).mock.calls.map((call) => String(call[0]));
    expect(urls.some((url) => url.includes("/auth/"))).toBe(false);
    expect(urls.some((url) => url.includes("/notifications"))).toBe(false);
  });

  it("does not keep the skeleton after an abandoned catalogue request", async () => {
    const never = new Promise<Response>(() => undefined);
    let productCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/v1/categories")) {
          return new Response(JSON.stringify(envelope([])), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (/\/api\/v1\/products\/[^?]+/.test(url) && !url.includes("?")) {
          productCalls += 1;
          if (url.includes("first-item")) return never;
          return new Response(JSON.stringify(envelope(published)), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("{}", { status: 404 });
      }),
    );

    function DetailDriver() {
      const [slug, setSlug] = useState("first-item");
      return (
        <MemoryRouter key={slug} initialEntries={[`/product/${slug}`]}>
          <AppProviders>
            <button type="button" onClick={() => setSlug("hospital-beds")}>
              next product
            </button>
            <Routes>
              <Route path="/product/:slug" element={<ProductDetailPage />} />
            </Routes>
          </AppProviders>
        </MemoryRouter>
      );
    }

    render(<DetailDriver />);
    expect(await screen.findByLabelText(/loading product/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next product/i }));
    expect(await screen.findByRole("heading", { name: /hospital beds/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/loading product/i)).not.toBeInTheDocument();
    expect(productCalls).toBeGreaterThan(1);
  });
});

describe("public product detail", () => {
  it("renders a published product, specifications, and request CTA", async () => {
    mockCatalog({ product: published });
    render(
      <MemoryRouter initialEntries={["/product/hospital-beds"]}>
        <AppProviders>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetailPage />} />
          </Routes>
        </AppProviders>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: /hospital beds/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request this product/i })).toHaveAttribute(
      "href",
      "/login?returnTo=%2Fapp%2Frequests%2Fnew%3Fproduct%3Dhospital-beds",
    );
    expect(screen.getByText(/bed type/i)).toBeInTheDocument();
    expect(screen.getByText(/available for procurement/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/catalogue image placeholder/i)).toBeInTheDocument();
  });

  it("sends authenticated buyers to create request with the product prefilled", async () => {
    optionalAuthState.status = "authenticated";
    mockCatalog({ product: published });
    render(
      <MemoryRouter initialEntries={["/app/products/hospital-beds"]}>
        <AppProviders>
          <Routes>
            <Route path="/app/products/:slug" element={<ProductDetailPage />} />
          </Routes>
        </AppProviders>
      </MemoryRouter>,
    );
    const cta = await screen.findByRole("link", { name: /request this product/i });
    expect(cta).toHaveAttribute("href", "/app/requests/new?product=hospital-beds");
  });

  it("renders a missing product state", async () => {
    mockCatalog({ productStatus: 404 });
    render(
      <MemoryRouter initialEntries={["/product/missing-item"]}>
        <AppProviders>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetailPage />} />
          </Routes>
        </AppProviders>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: /product not found/i })).toBeInTheDocument();
  });
});

describe("catalog search debounce", () => {
  it("keeps the typed query in the search field", async () => {
    mockCatalog({ products: [], categories: [] });
    render(
      <MemoryRouter initialEntries={["/products"]}>
        <AppProviders>
          <ProductsPage />
        </AppProviders>
      </MemoryRouter>,
    );
    const input = await screen.findByLabelText(/search products/i);
    fireEvent.change(input, { target: { value: "hospital" } });
    expect(input).toHaveValue("hospital");
    await waitFor(() => expect(input).toHaveValue("hospital"));
  });
});
