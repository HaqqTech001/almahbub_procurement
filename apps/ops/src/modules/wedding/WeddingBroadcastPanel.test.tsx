import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_WEDDING_CAMPAIGN, type WeddingCampaignRecord } from "@hamd/constants";

import { WeddingBroadcastPanel } from "./WeddingBroadcastPanel.js";

const livekit = vi.hoisted(() => {
  const stop = vi.fn();
  const attach = vi.fn();
  const disconnect = vi.fn().mockResolvedValue(undefined);
  const connect = vi.fn().mockResolvedValue(undefined);
  const publishTrack = vi.fn().mockResolvedValue(undefined);
  const setCameraEnabled = vi.fn().mockResolvedValue(undefined);
  const setMicrophoneEnabled = vi.fn().mockResolvedValue(undefined);
  return {
    stop,
    attach,
    disconnect,
    connect,
    publishTrack,
    setCameraEnabled,
    setMicrophoneEnabled,
  };
});

const opsFetch = vi.hoisted(() => vi.fn());

vi.mock("../../lib/ops-fetch.js", () => ({
  opsFetch,
  OpsApiError: class OpsApiError extends Error {
    status: number;
    code: string;
    constructor(message: string, status = 503, code = "LIVEKIT_UNAVAILABLE") {
      super(message);
      this.status = status;
      this.code = code;
    }
  },
}));

vi.mock("livekit-client", () => ({
  createLocalTracks: async () => [
    {
      kind: "video",
      stop: livekit.stop,
      attach: livekit.attach,
      detach: vi.fn(),
      mute: vi.fn(),
      unmute: vi.fn(),
      mediaStreamTrack: {
        getSettings: () => ({ width: 1920, height: 1080, frameRate: 30, deviceId: "cam" }),
        stop: livekit.stop,
      },
    },
    {
      kind: "audio",
      stop: livekit.stop,
      attach: vi.fn(),
      detach: vi.fn(),
      mute: vi.fn(),
      unmute: vi.fn(),
    },
  ],
  VideoPresets: {
    h1080: { resolution: { width: 1920, height: 1080, frameRate: 30 }, encoding: { maxBitrate: 3_000_000 } },
    h720: { resolution: { width: 1280, height: 720, frameRate: 30 }, encoding: { maxBitrate: 1_700_000 } },
    h360: { resolution: { width: 640, height: 360, frameRate: 20 } },
  },
  Room: class {
    connect = livekit.connect;
    disconnect = livekit.disconnect;
    on = vi.fn();
    localParticipant = {
      publishTrack: livekit.publishTrack,
      setCameraEnabled: livekit.setCameraEnabled,
      setMicrophoneEnabled: livekit.setMicrophoneEnabled,
    };
  },
}));

function Harness({ configured = true }: { configured?: boolean }) {
  const [campaign, setCampaign] = useState<WeddingCampaignRecord>({
    ...DEFAULT_WEDDING_CAMPAIGN,
    streamStatus: "upcoming",
  });
  return (
    <MemoryRouter>
      <WeddingBroadcastPanel
        accessToken={async () => "token"}
        campaign={campaign}
        configured={configured}
        viewers={2}
        onCampaign={setCampaign}
      />
    </MemoryRouter>
  );
}

describe("WeddingBroadcastPanel", () => {
  beforeEach(() => {
    livekit.stop.mockClear();
    livekit.attach.mockClear();
    livekit.disconnect.mockClear();
    livekit.connect.mockClear();
    livekit.publishTrack.mockClear();
    opsFetch.mockReset();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: async () => [],
      },
    });
  });

  it("shows setup-required and does not mint a token", async () => {
    render(<Harness configured={false} />);
    expect(screen.getByText(/Live streaming setup required/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start Live/i })).toBeDisabled();
    expect(opsFetch).not.toHaveBeenCalled();
  });

  it("starts live by connecting and publishing, then End Live disconnects tracks", async () => {
    opsFetch.mockImplementation(async (path: string) => {
      if (path === "/wedding/live/token") {
        return { url: "wss://livekit.example", token: "host-jwt" };
      }
      if (path === "/wedding/live/start") {
        return { ...DEFAULT_WEDDING_CAMPAIGN, streamStatus: "live" };
      }
      if (path === "/wedding/live/end") {
        return { ...DEFAULT_WEDDING_CAMPAIGN, streamStatus: "ended" };
      }
      throw new Error(path);
    });
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Start Live/i }));
    await waitFor(() => expect(livekit.connect).toHaveBeenCalledWith("wss://livekit.example", "host-jwt"));
    expect(livekit.publishTrack).toHaveBeenCalled();
    expect(opsFetch.mock.calls.filter(([path]) => path === "/wedding/live/token")).toHaveLength(1);
    expect(screen.getByText(/1080p · 30 fps/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /End Wedding Live Event/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /End Wedding Live Event/i }).at(-1)!);
    await waitFor(() => expect(livekit.disconnect).toHaveBeenCalledWith(true));
    expect(livekit.stop).toHaveBeenCalled();
    expect(opsFetch.mock.calls.some(([path]) => path === "/wedding/live/end")).toBe(true);
    expect(screen.getByRole("button", { name: /Camera off/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Microphone muted/i })).toBeInTheDocument();
  });

  it("stops owned preview tracks on unmount", async () => {
    const { unmount } = render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Open preview/i }));
    await waitFor(() => expect(livekit.attach).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /Close preview/i }));
    unmount();
    await waitFor(() => expect(livekit.stop).toHaveBeenCalled());
  });
});
