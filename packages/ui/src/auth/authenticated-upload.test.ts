import { afterEach, describe, expect, it, vi } from "vitest";
import { sessionAwareFetch, type SessionRetryHooks } from "./session-retry.js";
import { safeErrorMessage, userFacingError, validateDocumentFiles } from "./user-facing-error.js";
afterEach(() => vi.unstubAllGlobals());
const response = (status: number) => new Response(JSON.stringify({ error: { code: status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN" } }), { status });
function session() {
  let token = "expired";
  const hooks: SessionRetryHooks = {
    getAccessToken: () => token,
    ensureSession: vi.fn(async () => token),
    refreshSession: vi.fn(async () => { token = "fresh"; return true; }),
    onSessionLost: vi.fn(),
  };
  return hooks;
}
describe("authenticated uploads", () => {
  it("attaches Authorization and lets the browser set the boundary", async () => {
    const send = vi.fn(async () => response(201)); vi.stubGlobal("fetch", send);
    const body = new FormData(); body.append("files", new Blob(["image"]), "photo.png");
    await sessionAwareFetch("/documents", { method: "POST", body, headers: { "Content-Type": "multipart/form-data" } }, session());
    const init = (send.mock.calls as unknown as Array<[unknown, RequestInit]>)[0]![1];
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer expired");
    expect(new Headers(init.headers).has("Content-Type")).toBe(false);
    expect(init.body).toBe(body);
  });
  it("retries only the rejected upload, once, then creates one message", async () => {
    const hooks = session();
    const send = vi.fn().mockResolvedValueOnce(response(401)).mockResolvedValueOnce(response(201)).mockResolvedValueOnce(response(201)); vi.stubGlobal("fetch", send);
    const body = new FormData(); body.append("files", new Blob(["document"]), "file.pdf");
    await sessionAwareFetch("/documents", { method: "POST", body }, hooks);
    await sessionAwareFetch("/support/messages", { method: "POST", body: "message" }, hooks);
    expect(send.mock.calls.map(call => call[0])).toEqual(["/documents", "/documents", "/support/messages"]);
    expect(send.mock.calls[1]![1].body).toBe(body);
    expect(hooks.refreshSession).toHaveBeenCalledOnce();
    expect(hooks.onSessionLost).not.toHaveBeenCalled();
  });
  it("stops after a rejected refreshed token and never loops", async () => {
    const hooks = session(); const send = vi.fn(async () => response(401)); vi.stubGlobal("fetch", send);
    await sessionAwareFetch("/documents", { method: "POST" }, hooks);
    expect(send).toHaveBeenCalledTimes(2); expect(hooks.onSessionLost).toHaveBeenCalledOnce();
  });
  it("does not retry a forbidden or uncertain mutation", async () => {
    const hooks = session(); const send = vi.fn(async () => response(403)); vi.stubGlobal("fetch", send);
    await sessionAwareFetch("/documents", { method: "POST" }, hooks);
    expect(hooks.refreshSession).not.toHaveBeenCalled(); expect(send).toHaveBeenCalledOnce();
    send.mockRejectedValueOnce(new TypeError("network"));
    await expect(sessionAwareFetch("/documents", { method: "POST" }, hooks)).rejects.toThrow();
    expect(send).toHaveBeenCalledTimes(2);
  });
  it("refuses anonymous protected requests without leaking backend details", async () => {
    const send = vi.fn(); vi.stubGlobal("fetch", send);
    await expect(sessionAwareFetch("/documents", { method: "POST" }, null)).rejects.toThrow("Your session has expired");
    expect(send).not.toHaveBeenCalled();
    expect(safeErrorMessage('{"requestId":"x","code":"MISSING_BEARER_TOKEN"}', 401)).toBe("Your session has expired. Please sign in again to continue.");
    expect(userFacingError({ error: { code: "UPLOAD_MIME", message: "MIME type audio/mp4 is not allowed" } })).toBe("This file type isn't supported.");
    expect(() => validateDocumentFiles([new File(["audio"], "clip.m4a", { type: "audio/mp4" })])).toThrow("This file type isn't supported.");
  });
});
