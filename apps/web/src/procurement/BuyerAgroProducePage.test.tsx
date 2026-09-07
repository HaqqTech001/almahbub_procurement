import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { BuyerAgroProducePage } from "./BuyerAgroProducePage.js";

vi.mock("../integrated-export/commodities/use-published-ie-catalogue.js", () => ({
  usePublishedIeCommodities: () => ({
    previews: [
      {
        slug: "sesame-seed",
        name: "Sesame Seed",
        category: "Oilseeds",
        shortDescription: "Owner-approved sesame.",
        imageSrc: null,
      },
    ],
    commodities: [],
    source: "api",
    loading: false,
    error: null,
    retry: () => undefined,
  }),
}));

describe("BuyerAgroProducePage published data", () => {
  it("renders published commodities from the catalogue hook", () => {
    render(
      <MemoryRouter>
        <BuyerAgroProducePage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Sesame Seed")).toBeInTheDocument();
    expect(screen.queryByText("No Agro Produce published yet.")).not.toBeInTheDocument();
  });
});
