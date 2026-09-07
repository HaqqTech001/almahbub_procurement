import { describe, expect, it } from "vitest";

import {
  formatWeddingCaptureLabel,
  sanitizeWeddingFeedLabel,
  weddingCaptureAttempts,
  weddingHostIdentity,
} from "./wedding-campaign.js";

describe("wedding capture and feed helpers", () => {
  it("does not label VGA as HD", () => {
    expect(formatWeddingCaptureLabel({ width: 640, height: 480, frameRate: 30 })).toBe("640×480 · 30 fps");
    expect(formatWeddingCaptureLabel({ width: 1920, height: 1080, frameRate: 30 })).toBe("1080p · 30 fps");
    expect(formatWeddingCaptureLabel({ width: 1280, height: 720, frameRate: 30 })).toBe("720p · 30 fps");
  });

  it("requests 1080p first for auto and full HD", () => {
    expect(weddingCaptureAttempts("fhd")[0]).toEqual({ width: 1920, height: 1080, frameRate: 30 });
    expect(weddingCaptureAttempts("auto")[0]?.height).toBe(1080);
    expect(weddingCaptureAttempts("hd")[0]).toEqual({ width: 1280, height: 720, frameRate: 30 });
  });

  it("keeps host identities unique per session", () => {
    expect(weddingHostIdentity("user-a", "sess-1")).not.toBe(weddingHostIdentity("user-a", "sess-2"));
    expect(sanitizeWeddingFeedLabel("Family View")).toBe("Family View");
    expect(sanitizeWeddingFeedLabel("Admin 1")).toBe("Main Stage");
  });
});
