import { cleanup, fireEvent, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it } from "vitest";
import { PublicProductCard } from "./PublicProductCard.js";
import { toCatalogCard } from "../lib/catalog-display.js";

afterEach(cleanup);
it("tries assigned secondary media once, then removes an unusable public card", () => {
  const product = toCatalogCard({ slug: "freezer", name: "Chest Freezer", description: null, category: null, brandName: null, manufacturerName: null, videos: [], variants: [], images: [
    { url: "https://media.example/primary.webp", position: 0, altText: null },
    { url: "https://media.example/secondary.webp", position: 1, altText: null },
  ] });
  const { container } = render(<MemoryRouter><PublicProductCard product={product} /></MemoryRouter>);
  fireEvent.error(container.querySelector("img")!);
  expect(container.querySelector("img")).toHaveAttribute("src", "https://media.example/secondary.webp");
  fireEvent.error(container.querySelector("img")!);
  expect(container.querySelector("img")).toBeNull();
  expect(container.querySelector("article")).toBeNull();
});

it("does not show a public placeholder card when no image is assigned", () => {
  const product = toCatalogCard({ slug: "freezer", name: "Chest Freezer", description: null, category: null, brandName: null, manufacturerName: null, videos: [], variants: [], images: [] });
  const { container } = render(<MemoryRouter><PublicProductCard product={product} /></MemoryRouter>);
  expect(container.querySelector("article")).toBeNull();
});
