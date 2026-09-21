import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_WEDDING_CAMPAIGN, WEDDING_MEDIA_STORAGE_ID } from "@hamd/constants";
import { fetchWeddingCampaign, listWeddingWaitingAudio, postWeddingComment } from "./wedding-api.js";

vi.mock("../lib/api-origin.js", () => ({
  browserApiBase: vi.fn(() => "https://api.example.test"),
}));
import { configureWebSession } from "../auth/session/session-http.js";
import { browserApiBase } from "../lib/api-origin.js";

afterEach(() => {
  configureWebSession(null);
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("waiting audio URLs", () => {
  it("does not enable promotion after a malformed campaign response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({ data: [] }))));
    expect((await fetchWeddingCampaign()).modalEnabled).toBe(false);
  });
  it.each(["https://api.example.test", ""])(
    "resolves API media with base %s",
    async (base) => {
      vi.mocked(browserApiBase).mockReturnValue(base);
      const path = `/api/v1/public/catalog-media/${WEDDING_MEDIA_STORAGE_ID}/song.mp3`;
      const remote = "https://storage.example.test/catalog/song.mp3";
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                items: [
                  { id: "local", src: path },
                  { id: "remote", src: remote },
                ],
              },
            }),
            { headers: { "Content-Type": "application/json" } },
          ),
        ),
      );
      const rows = await listWeddingWaitingAudio();
      expect(rows.map((row) => row.src)).toEqual([`${base}${path}`, remote]);
      expect(fetch).toHaveBeenCalledWith(
        `${base}/api/v1/wedding/waiting-audio`,
        expect.any(Object),
      );
    },
  );
});


describe("public campaign refresh", () => {
  it("remains public after anonymous session initialization while comments still require authentication", async () => {
    const ensureSession = vi.fn().mockResolvedValue(null);
    configureWebSession({ getAccessToken: () => null, ensureSession, refreshSession: vi.fn().mockResolvedValue(false), onSessionLost: vi.fn() });
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ data: { ...DEFAULT_WEDDING_CAMPAIGN, modalEnabled: true } }), { headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await fetchWeddingCampaign()).modalEnabled).toBe(true);
    expect((await fetchWeddingCampaign()).modalEnabled).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(ensureSession).not.toHaveBeenCalled();
    await expect(postWeddingComment("Local test comment")).rejects.toThrow("Your session has expired. Please sign in again to continue.");
    expect(ensureSession).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
