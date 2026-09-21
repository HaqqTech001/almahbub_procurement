import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { inspectProductMedia } from "../infrastructure/product-media-health.js";

vi.mock("node:dns/promises", () => ({ lookup: vi.fn() }));
vi.mock("node:https", () => ({ request: vi.fn() }));

function serve(status: number, type = "image/png", body = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), location?: string) {
  vi.mocked(request).mockImplementationOnce((...args: unknown[]) => {
    const callback = args[2] as (response: unknown) => void;
    const response = Object.assign(new EventEmitter(), {
      statusCode: status, headers: { "content-type": type, location },
      destroy() { this.emit("close"); connection.emit("close"); },
    });
    const connection = Object.assign(new EventEmitter(), {
      end() { queueMicrotask(() => { callback(response); response.emit("data", body); response.emit("end"); connection.emit("close"); }); },
      destroy() { this.emit("close"); },
    });
    return connection as unknown as ReturnType<typeof request>;
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(lookup).mockResolvedValue([{ address: "8.8.8.8", family: 4 }] as never);
});
describe("bounded public image checks", () => {
  it("accepts an image response but does not mistake HTML for photography", async () => {
    serve(206);
    expect(await inspectProductMedia("https://media.example/image.png")).toBe("valid");
    serve(200, "text/html", Buffer.from("login page"));
    expect(await inspectProductMedia("https://media.example/login.png")).toBe("broken");
    serve(200, "image/png", Buffer.from("not an image"));
    expect(await inspectProductMedia("https://media.example/fake.png")).toBe("broken");
  });
  it("distinguishes stale 404s from temporary/unauthorized media", async () => {
    serve(404);
    expect(await inspectProductMedia("https://media.example/missing.png")).toBe("broken");
    serve(503);
    expect(await inspectProductMedia("https://media.example/unavailable.png")).toBe("unverified");
  });
  it("revalidates redirects and never connects to private addresses", async () => {
    serve(302, "image/png", Buffer.alloc(0), "http://127.0.0.1/private");
    vi.mocked(lookup).mockResolvedValueOnce([{ address: "8.8.8.8", family: 4 }] as never)
      .mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }] as never);
    expect(await inspectProductMedia("https://media.example/redirect")).toBe("unverified");
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("pins the validated address and sends no provider credentials", async () => {
    serve(200);
    await inspectProductMedia("https://media.example/image.png");
    const options = vi.mocked(request).mock.calls[0]?.[1] as { headers: Record<string, string>; lookup: (...args: unknown[]) => void };
    expect(options.headers).toEqual({ Range: "bytes=0-63", Accept: "image/*" });
    const callback = vi.fn();
    options.lookup("changed-dns.example", {}, callback);
    expect(callback).toHaveBeenCalledWith(null, "8.8.8.8", 4);
  });
});
