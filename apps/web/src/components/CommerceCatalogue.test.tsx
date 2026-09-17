import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { InternationalCategories, ExportCommodities } from "./CommerceCatalogue.js";
const list = vi.hoisted(() => vi.fn(() => new Promise(() => {})));
vi.mock("../api/catalog-api.js", () => ({ listPublicCategories: list }));
vi.mock("../integrated-export/commodities/use-published-ie-catalogue.js", () => ({ usePublishedIeCommodities: list }));
afterEach(cleanup);
it("renders all permanent introductions without waiting for catalogue startup", () => {
  render(<MemoryRouter><InternationalCategories /><ExportCommodities /></MemoryRouter>);
  expect(within(screen.getByRole("list", {name: "International categories"})).getAllByRole("img")).toHaveLength(10);
  expect(within(screen.getByRole("list", {name: "Integrated Export commodities"})).getAllByRole("img")).toHaveLength(7);
  expect(list).not.toHaveBeenCalled();
  for (const img of screen.getAllByRole("img")) expect(img.getAttribute("src")).toMatch(/^\/media\/presentation\/v2\//);
});
it("loads the first above-fold cards eagerly, retaining lazy loading below", () => {
  render(<MemoryRouter><InternationalCategories aboveFold /></MemoryRouter>);
  const images = screen.getAllByRole("img");
  expect(images[0]).toHaveAttribute("loading", "eager");
  expect(images[1]).toHaveAttribute("loading", "eager");
  expect(images[2]).toHaveAttribute("loading", "lazy");
});
