import { describe, expect, it, vi } from "vitest";

import { createWeddingHostTracks } from "./create-wedding-host-tracks.js";

describe("createWeddingHostTracks", () => {
  it("requests 1080p first and reports actual track settings", async () => {
    const createLocalTracks = vi.fn(async (options: { video?: { resolution?: { width: number } } }) => {
      expect(options.video?.resolution?.width).toBe(1920);
      return [
        {
          kind: "video",
          stop: () => undefined,
          attach: () => undefined,
          detach: () => undefined,
          mute: () => undefined,
          unmute: () => undefined,
          mediaStreamTrack: {
            getSettings: () => ({ width: 1920, height: 1080, frameRate: 30, deviceId: "cam-1" }),
          } as MediaStreamTrack,
        },
      ];
    });
    const result = await createWeddingHostTracks({
      quality: "fhd",
      livekit: {
        createLocalTracks,
        VideoPresets: {
          h1080: { resolution: {}, encoding: { maxBitrate: 3_000_000 } },
          h720: { resolution: {}, encoding: { maxBitrate: 1_700_000 } },
          h360: { resolution: {} },
        },
      },
    });
    expect(result.capture.label).toBe("1080p · 30 fps");
    expect(result.capture.width).toBe(1920);
    expect(result.publish).toMatchObject({ simulcast: true, degradationPreference: "maintain-resolution" });
  });

  it("falls back to 720p when 1080p capture fails", async () => {
    const createLocalTracks = vi.fn(async (options: { video?: { resolution?: { height: number } } }) => {
      if (options.video?.resolution?.height === 1080) throw new Error("overconstrained");
      return [
        {
          kind: "video",
          stop: () => undefined,
          attach: () => undefined,
          detach: () => undefined,
          mute: () => undefined,
          unmute: () => undefined,
          mediaStreamTrack: {
            getSettings: () => ({ width: 1280, height: 720, frameRate: 30 }),
          } as MediaStreamTrack,
        },
      ];
    });
    const result = await createWeddingHostTracks({
      quality: "auto",
      livekit: {
        createLocalTracks,
        VideoPresets: {
          h1080: { resolution: {}, encoding: {} },
          h720: { resolution: {}, encoding: {} },
          h360: { resolution: {} },
        },
      },
    });
    expect(result.capture.label).toBe("720p · 30 fps");
    expect(createLocalTracks).toHaveBeenCalledTimes(2);
  });
});
