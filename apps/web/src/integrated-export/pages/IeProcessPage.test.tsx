import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { IeProcessPage } from "./IeProcessPage.js";
import { IE_PATHS } from "../ie-paths.js";
describe("IeProcessPage buyer guidance", () => {
  it("keeps essential order information and a single quotation action", () => {
    render(
      <MemoryRouter>
        <IeProcessPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "From enquiry to export" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Agree quality and documents" }),
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
