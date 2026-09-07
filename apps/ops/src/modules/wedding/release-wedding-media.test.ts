import { describe, expect, it, vi } from "vitest";

import {
  clearPreviewElement,
  disconnectWeddingHostRoom,
  stopMediaStream,
  stopOwnedTracks,
} from "./release-wedding-media.js";

describe("wedding media release", () => {
  it("stops every track on an owned MediaStream", () => {
    const stop = vi.fn();
    const stream = {
      getTracks: () => [{ stop }, { stop }],
    } as unknown as MediaStream;
    stopMediaStream(stream);
    expect(stop).toHaveBeenCalledTimes(2);
  });

  it("disconnects the LiveKit room with local-track stopping enabled", async () => {
    const disconnect = vi.fn().mockResolvedValue(undefined);
    await disconnectWeddingHostRoom({ disconnect });
    expect(disconnect).toHaveBeenCalledWith(true);
  });

  it("stops independently owned preview tracks", () => {
    const stop = vi.fn();
    stopOwnedTracks([{ stop }, { stop }]);
    expect(stop).toHaveBeenCalledTimes(2);
  });

  it("clears a preview video element", () => {
    const stop = vi.fn();
    const node = {
      srcObject: { getTracks: () => [{ stop }] },
    } as unknown as HTMLVideoElement;
    clearPreviewElement(node);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(node.srcObject).toBeNull();
  });
});
