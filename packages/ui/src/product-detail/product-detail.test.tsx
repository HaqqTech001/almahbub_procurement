import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductDetailPage } from "./ProductDetailPage.js";
import { ProductGallery } from "./ProductGallery.js";
import { productDetailFixture } from "./fixtures.js";
import type { ProductDetailModel } from "./types.js";

const testProduct: ProductDetailModel = {
  ...productDetailFixture,
  images: [
    {
      id: "img1",
      src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='30'><rect width='40' height='30' fill='%23155aaf'/></svg>",
      alt: "Ball valve front view",
    },
    {
      id: "img2",
      src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='30'><rect width='40' height='30' fill='%23123b66'/></svg>",
      alt: "Ball valve side profile",
    },
  ],
};

describe("ProductGallery", () => {
  it("switches thumbnails and opens image preview", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={testProduct.images} productName="Valve" />);

    expect(screen.getByRole("img", { name: /product images for valve/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show image 2/i }));
    expect(screen.getByRole("img", { name: /product images for valve/i }).querySelector("img")).toHaveAttribute(
      "alt",
      "Ball valve side profile",
    );

    await user.click(screen.getByRole("img", { name: /product images for valve/i }));
    expect(screen.getByRole("dialog", { name: /image preview/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows empty state when image src missing", () => {
    render(
      <ProductGallery
        images={[{ id: "x", src: "", alt: "Missing" }]}
        productName="Valve"
      />,
    );
    expect(screen.getByText(/image not provided/i)).toBeInTheDocument();
  });
});

describe("ProductDetailPage", () => {
  it("renders all required sections and procurement CTA", () => {
    render(<ProductDetailPage product={testProduct} />);

    expect(screen.getByRole("heading", { level: 1, name: testProduct.name })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /skip to procurement request/i })).toHaveAttribute(
      "href",
      "#pd-procurement-cta",
    );
    expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /sourcing facts/i })).toBeInTheDocument();
    const facts = screen.getByRole("heading", { name: /sourcing facts/i }).closest("section");
    expect(facts).toBeTruthy();
    expect(within(facts!).getByText("Manufacturer")).toBeInTheDocument();
    expect(within(facts!).getByText("Supplier")).toBeInTheDocument();
    expect(within(facts!).getByText("Country of origin")).toBeInTheDocument();
    expect(within(facts!).getByText("MOQ")).toBeInTheDocument();
    expect(within(facts!).getByText("Lead time")).toBeInTheDocument();
    expect(within(facts!).getByText("Availability")).toBeInTheDocument();
    expect(within(facts!).getByText("Available to source")).toBeInTheDocument();
    expect(screen.queryByText(/in stock/i)).not.toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Specifications" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Downloads" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Certificates" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Related products" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recommended products" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Frequently sourced together" }),
    ).toBeInTheDocument();

    const cta = document.getElementById("pd-procurement-cta");
    expect(cta).toBeTruthy();
    expect(
      within(cta!).getByRole("link", { name: /request this product/i }),
    ).toHaveAttribute("href", testProduct.requestHref);
  });

  it("wires save/compare/request handlers", async () => {
    const user = userEvent.setup();
    const onBookmark = vi.fn();
    const onCompare = vi.fn();
    const onRequest = vi.fn();

    render(
      <ProductDetailPage
        product={testProduct}
        onBookmark={onBookmark}
        onCompare={onCompare}
        onRequest={onRequest}
      />,
    );

    await user.click(screen.getByRole("link", { name: /request this product/i }));
    expect(onRequest).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /save .* bookmarks/i }));
    expect(onBookmark).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^compare /i }));
    expect(onCompare).toHaveBeenCalled();
  });

  it("supports loading skeleton and dark theme wrapper", () => {
    const { rerender } = render(<ProductDetailPage product={testProduct} loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();

    rerender(
      <div data-theme="dark">
        <ProductDetailPage product={testProduct} />
      </div>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(testProduct.name);
  });
});
