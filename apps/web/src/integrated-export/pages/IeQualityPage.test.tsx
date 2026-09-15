import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { IeQualityPage } from "./IeQualityPage.js";
import { IE_PATHS } from "../ie-paths.js";
describe("IeQualityPage buyer guidance", () => {
  it("keeps essential order information and a single quotation action", () => {
    render(
      <MemoryRouter>
        <IeQualityPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Quality & Compliance" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Documentation" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Request a Quote" }),
    ).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "Request a Quote" }),
    ).toHaveAttribute("href", IE_PATHS.request);
    expect(document.querySelector('a[href="/group"]')).toBeNull();
  });
});
