import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseEnvironment } from "../../../config/env.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import {
  WeddingCampaignService,
  markWeddingCampaignUnhydratedForTests,
  markWeddingWaitingTracksUnhydratedForTests,
  resetWeddingCampaignForTests,
} from "./wedding-campaign-service.js";

function auth(permissions: string[]): AuthContext {
  return {
    userId: "11111111-1111-4111-8111-111111111111",
    organizationId: "22222222-2222-4222-8222-222222222222",
    membershipId: "33333333-3333-4333-8333-333333333333",
    sessionId: "44444444-4444-4444-8444-444444444444",
    permissionKeys: new Set(permissions),
  };
}

describe("WeddingCampaignService", () => {
  it("does not allow a viewer to mint a publisher token", async () => {
    resetWeddingCampaignForTests();
    const service = new WeddingCampaignService(
      parseEnvironment({
        NODE_ENV: "test",
        LIVEKIT_URL: "wss://livekit.example",
        LIVEKIT_API_KEY: "devkey",
        LIVEKIT_API_SECRET: "devsecret-devsecret-devsecret-xx",
      }),
    );
    service.startLive(auth(["ops:access"]), "production");
    const buyer = auth([]);
    const token = await service.liveToken(buyer, "host");
    expect(token.role).toBe("viewer");
    const payload = JSON.parse(
      Buffer.from(token.token.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { video: { canPublish: boolean } };
    expect(payload.video.canPublish).toBe(false);
  });

  it("allows ops to mint a publisher token", async () => {
    resetWeddingCampaignForTests();
    const service = new WeddingCampaignService(
      parseEnvironment({
        NODE_ENV: "test",
        LIVEKIT_URL: "wss://livekit.example",
        LIVEKIT_API_KEY: "devkey",
        LIVEKIT_API_SECRET: "devsecret-devsecret-devsecret-xx",
      }),
    );
    const token = await service.liveToken(auth(["ops:access"]), "host");
    expect(token.role).toBe("host");
    expect(token.serverUrl).toBe(token.url);
    expect("apiKey" in token).toBe(false);
    expect("apiSecret" in token).toBe(false);
    const payload = JSON.parse(
      Buffer.from(token.token.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { video: { canPublish: boolean } };
    expect(payload.video.canPublish).toBe(true);
  });

  it("persists comments and supports moderation", async () => {
    resetWeddingCampaignForTests();
    const service = new WeddingCampaignService(parseEnvironment({ NODE_ENV: "test" }));
    const row = await service.addComment(auth([]), "Mabrook");
    expect(service.listComments()).toHaveLength(1);
    service.moderateComment(auth(["ops:access"]), row.id, true);
    expect(service.listComments()).toHaveLength(0);
    expect(service.listComments(true)[0]?.hidden).toBe(true);
  });

  it("accepts a valid JPEG under 10MB", async () => {
    resetWeddingCampaignForTests();
    const bytes = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xd9]), Buffer.alloc(32)]);
    const service = new WeddingCampaignService(parseEnvironment({ NODE_ENV: "test" }), undefined, {
      put: async () => ({ filename: "photo.jpg", publicUrl: "/api/v1/public/catalog-media/w/photo.jpg" }),
      remove: async () => undefined,
    });
    const item = await service.addGalleryItem(
      auth(["ops:access"]),
      {
        originalFilename: "photo.jpg",
        mimeType: "image/jpeg",
        sizeBytes: bytes.length,
        buffer: bytes,
      },
      { title: "Altar" },
    );
    expect(item.title).toBe("Altar");
    expect(item.kind).toBe("image");
  });

  it("returns 503 when LiveKit is not configured", async () => {
    resetWeddingCampaignForTests();
    const service = new WeddingCampaignService(parseEnvironment({ NODE_ENV: "test" }));
    await expect(service.liveToken(auth(["ops:access"]), "host")).rejects.toMatchObject({
      statusCode: 503,
      code: "LIVEKIT_UNAVAILABLE",
    });
    expect(service.isLiveKitConfigured()).toBe(false);
  });

  it("ends the campaign without inventing a recording", async () => {
    resetWeddingCampaignForTests();
    const service = new WeddingCampaignService(
      parseEnvironment({
        NODE_ENV: "test",
        LIVEKIT_URL: "wss://livekit.example",
        LIVEKIT_API_KEY: "devkey",
        LIVEKIT_API_SECRET: "devsecret-devsecret-devsecret-xx",
      }),
    );
    service.setStreamStatus(auth(["ops:access"]), "live");
    expect(service.getRecording()).toBeNull();
    const ended = await service.endLive(auth(["ops:access"]));
    expect(ended.streamStatus).toBe("ended");
    expect(ended.endedKind).toBe("production");
    expect(ended.recordingAvailable).toBe(false);
  });

  it("keeps a test broadcast off the public campaign and on a separate room", async () => {
    resetWeddingCampaignForTests();
    const service = new WeddingCampaignService(
      parseEnvironment({
        NODE_ENV: "test",
        LIVEKIT_URL: "wss://livekit.example",
        LIVEKIT_API_KEY: "devkey",
        LIVEKIT_API_SECRET: "devsecret-devsecret-devsecret-xx",
        WEDDING_TEST_CONTROLS: "true",
      }),
    );
    const ops = auth(["ops:access"]);
    const started = service.startLive(ops, "test");
    expect(started.liveMode).toBe("test");
    expect(started.streamStatus).toBe("live");
    const guest = service.getCampaign(auth([]));
    expect(guest.testBroadcastEligible).toBe(true);
    expect(guest.liveMode).toBe("test");
    const host = await service.liveToken(ops, "host", "test");
    expect(host.room).toBe("rowdotul-hamd-26-test");
    expect(host.identity).toMatch(/^host:/);
    const ended = await service.endLive(ops);
    expect(ended.streamStatus).toBe("upcoming");
    expect(ended.endedKind).toBe("test");
    expect(ended.liveMode).toBe("none");
  });

  it("keeps unique host identities and does not end the event on stop-my-broadcast", async () => {
    resetWeddingCampaignForTests();
    const service = new WeddingCampaignService(
      parseEnvironment({
        NODE_ENV: "test",
        LIVEKIT_URL: "wss://livekit.example",
        LIVEKIT_API_KEY: "devkey",
        LIVEKIT_API_SECRET: "devsecret-devsecret-devsecret-xx",
      }),
    );
    const ops = auth(["ops:access"]);
    const opsB: AuthContext = { ...ops, sessionId: "55555555-5555-4555-8555-555555555555" };
    const hostA = await service.liveToken(ops, "host", "production");
    const hostB = await service.liveToken(opsB, "host", "production");
    expect(hostA.identity).not.toBe(hostB.identity);
    service.startLive(ops, "production", { feedLabel: "Main Stage" });
    service.startLive(opsB, "production", { feedLabel: "Family View" });
    const campaign = service.getCampaign(ops);
    expect(campaign.feeds?.map((row) => row.label).sort()).toEqual(["Family View", "Main Stage"]);
    const stopped = await service.stopMyBroadcast(ops);
    expect(stopped.streamStatus).toBe("live");
    expect(stopped.feeds?.some((row) => row.label === "Family View")).toBe(true);
    expect(stopped.feeds?.some((row) => row.label === "Main Stage")).toBe(false);
  });

  it("hides a test broadcast from visitors who are not eligible", () => {
    resetWeddingCampaignForTests();
    const service = new WeddingCampaignService(
      parseEnvironment({
        NODE_ENV: "test",
        LIVEKIT_URL: "wss://livekit.example",
        LIVEKIT_API_KEY: "devkey",
        LIVEKIT_API_SECRET: "devsecret-devsecret-devsecret-xx",
        WEDDING_TEST_CONTROLS: "false",
      }),
    );
    const ops = auth(["ops:access"]);
    service.startLive(ops, "test");
    const guest = service.getCampaign(auth([]));
    expect(guest.streamStatus).toBe("upcoming");
    expect(guest.liveMode).toBe("none");
    expect(guest.testBroadcastEligible).toBe(false);
    expect(service.getCampaign(ops).liveMode).toBe("test");
  });

  it("rejects gallery files over 10MB", async () => {
    resetWeddingCampaignForTests();
    const service = new WeddingCampaignService(parseEnvironment({ NODE_ENV: "test" }));
    const bytes = Buffer.alloc(10 * 1024 * 1024 + 1, 0xff);
    await expect(
      service.addGalleryItem(
        auth(["ops:access"]),
        {
          originalFilename: "photo.jpg",
          mimeType: "image/jpeg",
          sizeBytes: bytes.length,
          buffer: bytes,
        },
        {},
      ),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it("rejects test controls when the flag is off", () => {
    resetWeddingCampaignForTests();
    const service = new WeddingCampaignService(
      parseEnvironment({ NODE_ENV: "test", WEDDING_TEST_CONTROLS: "false" }),
    );
    expect(() => service.applyTestControl(auth(["ops:access"]), "live")).toThrow(
      /disabled/i,
    );
  });

  it("applies test controls when the flag is on", () => {
    resetWeddingCampaignForTests();
    const service = new WeddingCampaignService(
      parseEnvironment({ NODE_ENV: "test", WEDDING_TEST_CONTROLS: "true" }),
    );
    expect(service.applyTestControl(auth(["ops:access"]), "live").streamStatus).toBe("live");
  });

  it("uploads multiple waiting tracks, persists reorder, and skips disabled rows", async () => {
    resetWeddingCampaignForTests();
    const root = await mkdtemp(join(tmpdir(), "wedding-waiting-"));
    const removed: string[] = [];
    const service = new WeddingCampaignService(
      parseEnvironment({ NODE_ENV: "test", UPLOAD_ROOT: root }),
      undefined,
      {
        put: async (input) => ({
          filename: input.originalFilename,
          publicUrl: `/api/v1/public/catalog-media/w/${input.originalFilename}`,
        }),
        remove: async (input) => {
          removed.push(input.filename);
        },
      },
    );
    const ops = auth(["ops:access"]);
    const mp3 = Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00, 0x00]);
    const m4a = Buffer.alloc(16);
    m4a.write("ftyp", 4);
    m4a.write("M4A ", 8);
    const first = await service.addWaitingTrack(
      ops,
      { originalFilename: "a.mp3", mimeType: "audio/mpeg", sizeBytes: mp3.length, buffer: mp3 },
      { title: "A" },
    );
    const second = await service.addWaitingTrack(
      ops,
      { originalFilename: "b.m4a", mimeType: "audio/mp4", sizeBytes: m4a.length, buffer: m4a },
      { title: "B" },
    );
    const third = await service.addWaitingTrack(
      ops,
      { originalFilename: "c.mp3", mimeType: "audio/mpeg", sizeBytes: mp3.length, buffer: mp3 },
      { title: "C" },
    );
    const reordered = await service.reorderWaitingTracks(ops, [third.id, first.id, second.id]);
    expect(reordered.map((row) => row.title)).toEqual(["C", "A", "B"]);
    await service.updateWaitingTrack(ops, first.id, { enabled: false });
    expect((await service.listWaitingTracks(false)).map((row) => row.title)).toEqual(["C", "B"]);
    markWeddingWaitingTracksUnhydratedForTests();
    const hydrated = new WeddingCampaignService(
      parseEnvironment({ NODE_ENV: "test", UPLOAD_ROOT: root }),
      undefined,
      {
        put: async (input) => ({
          filename: input.originalFilename,
          publicUrl: `/api/v1/public/catalog-media/w/${input.originalFilename}`,
        }),
        remove: async () => undefined,
      },
    );
    expect((await hydrated.listWaitingTracks(true)).map((row) => row.title)).toEqual(["C", "A", "B"]);
    await service.removeWaitingTrack(ops, second.id);
    expect(removed).toContain("b.m4a");
  });

  it("rejects waiting audio that fails size or magic-byte checks", async () => {
    resetWeddingCampaignForTests();
    const service = new WeddingCampaignService(parseEnvironment({ NODE_ENV: "test" }), undefined, {
      put: async () => ({ filename: "x.mp3", publicUrl: "/api/v1/public/catalog-media/w/x.mp3" }),
      remove: async () => undefined,
    });
    const ops = auth(["ops:access"]);
    await expect(
      service.addWaitingTrack(ops, {
        originalFilename: "speech.wav",
        mimeType: "audio/wav",
        sizeBytes: 8,
        buffer: Buffer.from("RIFFWAVE"),
      }),
    ).rejects.toMatchObject({ statusCode: 422, code: "UPLOAD_MIME" });
    const huge = Buffer.concat([Buffer.from([0x49, 0x44, 0x33]), Buffer.alloc(25 * 1024 * 1024)]);
    await expect(
      service.addWaitingTrack(ops, {
        originalFilename: "long.mp3",
        mimeType: "audio/mpeg",
        sizeBytes: huge.length,
        buffer: huge,
      }),
    ).rejects.toMatchObject({ statusCode: 422, code: "UPLOAD_SIZE" });
  });

  it("persists campaign overlay to the database and hydrates after restart", async () => {
    resetWeddingCampaignForTests();
    markWeddingCampaignUnhydratedForTests();
    let stored: {
      id: string;
      slug: string;
      streamStatus: string;
      overlay: Record<string, unknown>;
    } | null = null;
    const database = {
      weddingCampaign: {
        findUnique: async () => stored,
        upsert: async (args: {
          create: typeof stored;
          update: Partial<NonNullable<typeof stored>>;
        }) => {
          stored = {
            id: "founder-wedding-september-2026",
            slug: args.update?.slug ?? args.create?.slug ?? "rowdotul-hamd-26",
            streamStatus: args.update?.streamStatus ?? args.create?.streamStatus ?? "upcoming",
            overlay: {
              ...((args.create?.overlay ?? {}) as Record<string, unknown>),
              ...((args.update?.overlay ?? {}) as Record<string, unknown>),
            },
          };
          return { id: stored.id };
        },
      },
    };
    const first = new WeddingCampaignService(
      parseEnvironment({ NODE_ENV: "test" }),
      database as never,
    );
    first.updateInvitation(auth(["ops:access"]), { venue: "Family compound" });
    await first.flushCampaignPersistence();
    expect(stored?.overlay.venue).toBe("Family compound");
    expect(stored?.overlay.eventAt).toBe("2026-09-29");

    resetWeddingCampaignForTests();
    markWeddingCampaignUnhydratedForTests();
    const restarted = new WeddingCampaignService(
      parseEnvironment({ NODE_ENV: "test" }),
      database as never,
    );
    await restarted.ensureCampaignHydrated();
    expect(restarted.getCampaign(auth(["ops:access"])).venue).toBe("Family compound");
    expect(restarted.getCampaign().eventAt).toBe("2026-09-29");
    expect(String(restarted.getCampaign().eventAt)).not.toContain("T");
  });
});
