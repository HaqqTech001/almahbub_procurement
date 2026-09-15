import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { IeAboutPage } from "./IeAboutPage.js";
import { IE_PATHS } from "../ie-paths.js";
describe("IeAboutPage buyer guidance", () => {
  it("keeps essential order information and a single quotation action", () => {
    render(
      <MemoryRouter>
        <IeAboutPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "About Almahbub Integrated Export",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Plan your commodity order" }),
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
