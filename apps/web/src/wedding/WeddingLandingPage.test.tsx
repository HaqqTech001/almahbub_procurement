import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_WEDDING_CAMPAIGN } from "@hamd/constants";

import { WeddingLandingPage } from "./WeddingLandingPage.js";

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({
    status: "anonymous",
  }),
}));

vi.mock("./wedding-api.js", () => ({
  fetchWeddingCampaign: vi.fn().mockResolvedValue({
    ...DEFAULT_WEDDING_CAMPAIGN,
    venue: "Ilorin",
  }),
  listWeddingGallery: vi.fn().mockResolvedValue([]),
  listWeddingComments: vi.fn().mockResolvedValue([]),
  postWeddingComment: vi.fn(),
}));

describe("WeddingLandingPage", () => {
  it("renders the invitation landing without requiring auth", async () => {
    render(
      <MemoryRouter>
        <WeddingLandingPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: "Rowdotul HAMD'26" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Join Live/i })).toBeTruthy();
  });
});
