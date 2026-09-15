import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { GroupPage } from "./GroupPage.js";
import { BusinessesIndexRedirect } from "./BusinessPage.js";
describe("obsolete gateway routes", () => {
  it.each(["/group", "/businesses"])("redirects %s to the homepage", (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<h1>Commerce homepage</h1>} />
          <Route path="/group" element={<GroupPage />} />
          <Route path="/businesses" element={<BusinessesIndexRedirect />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Commerce homepage" }),
    ).toBeInTheDocument();
  });
});
