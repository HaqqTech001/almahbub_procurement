import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_WEDDING_CAMPAIGN } from "@hamd/constants";

import { WeddingLivePage } from "./WeddingLivePage.js";

const fetchWeddingCampaign = vi.hoisted(() => vi.fn());
const fetchWeddingLiveStatus = vi.hoisted(() => vi.fn());
const fetchWeddingLiveToken = vi.hoisted(() => vi.fn());
const listWeddingComments = vi.hoisted(() => vi.fn());
const listWeddingWaitingAudio = vi.hoisted(() => vi.fn());
const connectWeddingViewer = vi.hoisted(() => vi.fn());

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({ status: "authenticated" }),
}));

vi.mock("../app/providers/ThemeProvider.js", () => ({
  useTheme: () => ({
    theme: "light",
    resolved: "light",
    setTheme: () => undefined,
  }),
}));

vi.mock("./wedding-api.js", () => ({
  fetchWeddingCampaign,
  fetchWeddingLiveStatus,
  fetchWeddingLiveToken,
  listWeddingComments,
  postWeddingComment: vi.fn(),
  listWeddingWaitingAudio,
}));

vi.mock("./connect-wedding-viewer.js", () => ({
  connectWeddingViewer,
}));

describe("WeddingLivePage", () => {
  beforeEach(() => {
    fetchWeddingCampaign.mockReset();
    fetchWeddingLiveStatus.mockReset();
    fetchWeddingLiveToken.mockReset();
    listWeddingComments.mockReset();
    connectWeddingViewer.mockReset();
    listWeddingComments.mockResolvedValue([]);
    listWeddingWaitingAudio.mockReset();
    listWeddingWaitingAudio.mockResolvedValue([]);
    fetchWeddingLiveToken.mockRejectedValue(new Error("should not mint"));
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLMediaElement.prototype, "pause", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("shows the ended celebration without requesting a token", async () => {
    fetchWeddingCampaign.mockResolvedValue({
      ...DEFAULT_WEDDING_CAMPAIGN,
      streamStatus: "ended",
    });
    fetchWeddingLiveStatus.mockResolvedValue({ configured: true });
    render(
      <MemoryRouter>
        <WeddingLivePage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: /Thank you for celebrating with us/i })).toBeInTheDocument();
    expect(screen.getByTestId("wedding-live-portal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Gallery/i })).toBeInTheDocument();
    expect(fetchWeddingLiveToken).not.toHaveBeenCalled();
  });

  it("keeps waiting guests inside the dedicated portal", async () => {
    fetchWeddingCampaign.mockResolvedValue({
      ...DEFAULT_WEDDING_CAMPAIGN,
      streamStatus: "upcoming",
    });
    fetchWeddingLiveStatus.mockResolvedValue({ configured: true });
    render(
      <MemoryRouter>
        <WeddingLivePage />
      </MemoryRouter>,
    );
    expect(await screen.findByText("WAITING")).toBeInTheDocument();
    expect(screen.getByTestId("wedding-live-portal")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: DEFAULT_WEDDING_CAMPAIGN.title })).toBeInTheDocument();
    expect(fetchWeddingLiveToken).not.toHaveBeenCalled();
  });

  it("keeps test-ended copy inside the portal", async () => {
    fetchWeddingCampaign.mockResolvedValue({
      ...DEFAULT_WEDDING_CAMPAIGN,
      streamStatus: "upcoming",
      endedKind: "test",
    });
    fetchWeddingLiveStatus.mockResolvedValue({ configured: true });
    render(
      <MemoryRouter>
        <WeddingLivePage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: /Test broadcast ended/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Thank you for celebrating with us/i })).toBeNull();
  });

  it("does not POST a live token when LiveKit is not configured", async () => {
    fetchWeddingCampaign.mockResolvedValue({
      ...DEFAULT_WEDDING_CAMPAIGN,
      streamStatus: "live",
    });
    fetchWeddingLiveStatus.mockResolvedValue({ configured: false });
    render(
      <MemoryRouter>
        <WeddingLivePage />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Live streaming isn't configured yet/i)).toBeInTheDocument();
    expect(fetchWeddingLiveToken).not.toHaveBeenCalled();
    expect(connectWeddingViewer).not.toHaveBeenCalled();
  });

  it("shows compact waiting music controls without a guest playlist editor", async () => {
    listWeddingWaitingAudio.mockResolvedValue([
      {
        id: "a",
        title: "Opening Dua",
        src: "/api/v1/public/catalog-media/w/a.mp3",
        isEnabled: true,
        enabled: true,
        position: 0,
        sortOrder: 0,
      },
      {
        id: "b",
        title: "Nasheed Two",
        src: "/api/v1/public/catalog-media/w/b.mp3",
        isEnabled: true,
        enabled: true,
        position: 1,
        sortOrder: 1,
      },
    ]);
    fetchWeddingCampaign.mockResolvedValue({
      ...DEFAULT_WEDDING_CAMPAIGN,
      streamStatus: "upcoming",
      waitingMusicEnabled: true,
      waitingMusicLoop: true,
    });
    fetchWeddingLiveStatus.mockResolvedValue({ configured: true });
    render(
      <MemoryRouter>
        <WeddingLivePage />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Now playing Opening Dua/i)).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /Waiting music volume/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add Track/i })).toBeNull();
  });
});
