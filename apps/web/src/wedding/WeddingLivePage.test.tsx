import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  fetchWeddingParticipation: vi.fn().mockResolvedValue({ joined: false, subscribed: false }),
}));

vi.mock("./connect-wedding-viewer.js", () => ({
  connectWeddingViewer,
}));

describe("WeddingLivePage", () => {
  beforeEach(() => {
    sessionStorage.clear();
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
  function waiting(loop = true, multiple = false) {
    listWeddingWaitingAudio.mockResolvedValue([
      {id:"disabled",title:"Disabled",src:"/disabled.mp3",isEnabled:false,enabled:false,position:0},
      {id:"a",title:"First",src:"/first.mp3",isEnabled:true,enabled:true,position:1},
      ...(multiple ? [{id:"b",title:"Second",src:"/second.mp3",isEnabled:true,enabled:true,position:2}] : []),
    ]);
    fetchWeddingCampaign.mockResolvedValue({...DEFAULT_WEDDING_CAMPAIGN,streamStatus:"upcoming",waitingMusicEnabled:true,waitingMusicLoop:loop});
    fetchWeddingLiveStatus.mockResolvedValue({configured:false});
    return render(<MemoryRouter><WeddingLivePage /></MemoryRouter>);
  }
  it("reports autoplay rejection and retries from a user gesture, with mute/unmute", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new DOMException("Interaction required","NotAllowedError"));
    waiting();
    expect(await screen.findByText("Browser requires interaction")).toBeInTheDocument();
    expect(screen.queryByText(/Now playing/)).toBeNull();
    fireEvent.click(screen.getByRole("button",{name:"Play waiting music"}));
    expect(await screen.findByText("Playing")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:"Mute waiting music"}));
    expect(screen.getByText("Muted")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:"Unmute waiting music"}));
    expect(await screen.findByText("Playing")).toBeInTheDocument();
  });
  it("selects enabled audio and uses native single-track looping", async () => {
    waiting(); await screen.findByText(/Now playing First/);
    const audio=document.querySelector("audio")!;
    expect(audio.getAttribute("src")).toBe("/first.mp3"); expect(audio.loop).toBe(true);
  });
  it("advances through enabled tracks and loops to the first", async () => {
    waiting(true,true); await screen.findByText(/Now playing First/);
    const audio=document.querySelector("audio")!; expect(audio.loop).toBe(false);
    fireEvent.ended(audio); await screen.findByText(/Now playing Second/);
    fireEvent.ended(audio); await screen.findByText(/Now playing First/);
  });
  it("does not restart after the last track with loop off", async () => {
    waiting(false); await screen.findByText(/Now playing First/);
    const plays=vi.mocked(HTMLMediaElement.prototype.play).mock.calls.length;
    fireEvent.ended(document.querySelector("audio")!);
    await act(async()=>{});
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(plays);
    expect(screen.queryByText(/Now playing First/)).toBeNull();
  });
  it("stops waiting audio when the campaign becomes live", async () => {
    waiting(); await screen.findByText(/Now playing First/);
    fetchWeddingCampaign.mockResolvedValue({...DEFAULT_WEDDING_CAMPAIGN,streamStatus:"live",waitingMusicEnabled:true});
    await waitFor(()=>expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled(),{timeout:6000});
    expect(screen.queryByText(/Now playing First/)).toBeNull();
  });

});
