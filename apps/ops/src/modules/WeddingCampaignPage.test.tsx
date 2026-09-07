import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_WEDDING_CAMPAIGN } from "@hamd/constants";

import { WeddingCampaignPage } from "./WeddingCampaignPage.js";

const opsFetch = vi.hoisted(() => vi.fn());

vi.mock("../auth/session/auth-context.js", () => ({
  useAuth: () => ({
    status: "authenticated",
    ensureSession: async () => "token",
  }),
}));

vi.mock("../auth/session/token-store.js", () => ({
  getAccessToken: () => "token",
}));

vi.mock("../lib/ops-fetch.js", () => ({
  opsFetch,
  requireOpsToken: async () => "token",
}));

describe("WeddingCampaignPage", () => {
  beforeEach(() => {
    opsFetch.mockReset();
    opsFetch.mockImplementation(async (path: string) => {
      if (path === "/wedding/campaign") {
        return {
          ...DEFAULT_WEDDING_CAMPAIGN,
          livekitConfigured: false,
          testControlsEnabled: false,
        };
      }
      if (path === "/wedding/live/viewers") return { viewerCount: 0 };
      if (path === "/wedding/comments") return { items: [] };
      if (path === "/wedding/gallery") return { items: [] };
      if (path === "/wedding/waiting-audio") return { items: [] };
      throw new Error(`unexpected ${path}`);
    });
  });

  it("shows live-streaming setup required without requesting a token", async () => {
    render(
      <MemoryRouter>
        <WeddingCampaignPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Live streaming setup required/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: DEFAULT_WEDDING_CAMPAIGN.title })).toBeInTheDocument();
    expect(opsFetch.mock.calls.some(([path]) => path === "/wedding/live/token")).toBe(false);
    expect(screen.getByRole("button", { name: "Waiting Music" })).toBeInTheDocument();
  });
});
