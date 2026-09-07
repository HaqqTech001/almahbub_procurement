import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ServiceDetailPage } from "./ServiceDetailPage.js";

describe("ServiceDetailPage", () => {
  it("lists coverage as check rows without bullet markers", () => {
    render(
      <MemoryRouter initialEntries={["/services/global-procurement"]}>
        <Routes>
          <Route path="/services/:slug" element={<ServiceDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /global procurement/i })).toBeInTheDocument();
    const list = document.querySelector(".hamd-service-detail__rows");
    expect(list?.tagName).toBe("UL");
    expect(list?.querySelectorAll(".hamd-service-detail__row").length).toBeGreaterThan(0);
    expect(list?.querySelectorAll(".hamd-service-detail__check").length).toBeGreaterThan(0);
    expect(list?.querySelectorAll(".hamd-service-detail__row")).toHaveLength(
      list?.querySelectorAll("li").length ?? 0,
    );
  });
});
