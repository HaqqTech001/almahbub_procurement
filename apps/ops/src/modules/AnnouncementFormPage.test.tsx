import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AnnouncementFormPage } from "./AnnouncementFormPage.js";

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({
    ensureSession: async () => "token",
  }),
}));

vi.mock("../auth/session/token-store.js", () => ({
  getAccessToken: () => "token",
}));

vi.mock("../lib/ops-fetch.js", () => ({
  opsFetch: vi.fn(),
}));

describe("AnnouncementFormPage media", () => {
  it("rejects documents and keeps the three-item cap copy", async () => {
    render(
      <MemoryRouter initialEntries={["/cms/new"]}>
        <Routes>
          <Route path="/cms/new" element={<AnnouncementFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /create announcement/i })).toBeInTheDocument();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const pdf = new File(["%PDF"], "brief.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [pdf] } });
    expect(
      screen.getByText(/documents are not allowed/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("brief.pdf")).not.toBeInTheDocument();
  });
});
