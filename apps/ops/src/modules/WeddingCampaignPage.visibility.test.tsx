import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import { DEFAULT_WEDDING_CAMPAIGN } from "@hamd/constants";
import { WeddingCampaignPage } from "./WeddingCampaignPage.js";
const request = vi.hoisted(() => vi.fn());
vi.mock("../auth/session/auth-context.js", () => ({ useAuth: () => ({ ensureSession: async () => "token" }) }));
vi.mock("../lib/ops-fetch.js", () => ({ opsFetch: request, requireOpsToken: async () => "token" }));
it("saves the existing authoritative promotion switch off and on", async () => {
  let campaign = { ...DEFAULT_WEDDING_CAMPAIGN, modalEnabled: true };
  request.mockImplementation(async (path, options) => {
    if (path === "/wedding/campaign") { if (options.method === "PATCH") campaign = { ...campaign, ...options.body }; return campaign; }
    return { items: [], viewerCount: 0 };
  });
  render(<MemoryRouter><WeddingCampaignPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button", { name: "Invitation", exact: true }));
  const toggle = await screen.findByRole("switch", { name: "Enable wedding experience" });
  await waitFor(() => expect(toggle).toBeChecked());
  fireEvent.click(toggle); fireEvent.click(screen.getByRole("button", { name: "Save invitation" }));
  await waitFor(() => expect(campaign.modalEnabled).toBe(false));
  fireEvent.click(toggle); fireEvent.click(screen.getByRole("button", { name: "Save invitation" }));
  await waitFor(() => expect(campaign.modalEnabled).toBe(true));
});
