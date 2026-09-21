import { describe, expect, it, vi } from "vitest";

import {
  isAuthExpiryResponse,
  runWithSessionRetry,
} from "./session-retry.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("isAuthExpiryResponse", () => {
  it("treats 401 UNAUTHENTICATED as expiry", () => {
    expect(isAuthExpiryResponse(401, "UNAUTHENTICATED")).toBe(true);
    expect(isAuthExpiryResponse(401, "SESSION_REVOKED")).toBe(true);
    expect(isAuthExpiryResponse(401, null)).toBe(true);
  });

  it("does not treat 403 as session expiry", () => {
    expect(isAuthExpiryResponse(403, "FORBIDDEN")).toBe(false);
    expect(isAuthExpiryResponse(401, "FORBIDDEN")).toBe(false);
    expect(isAuthExpiryResponse(403, "UNAUTHENTICATED")).toBe(false);
  });
});

describe("runWithSessionRetry", () => {
  it("retries once after a successful refresh", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(401, { error: { code: "UNAUTHENTICATED" } }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { data: { ok: true } }));
    const hooks = {
      getAccessToken: vi
        .fn()
        .mockReturnValueOnce("expired")
        .mockReturnValueOnce("expired")
        .mockReturnValue("fresh"),
      ensureSession: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue(true),
      onSessionLost: vi.fn(),
    };

    const response = await runWithSessionRetry(execute, hooks);
    expect(response.status).toBe(200);
    expect(hooks.refreshSession).toHaveBeenCalledOnce();
    expect(hooks.onSessionLost).not.toHaveBeenCalled();
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute).toHaveBeenNthCalledWith(2, "fresh");
  });

  it("does not clear the session on a transient refresh failure", async () => {
    const execute = vi
      .fn()
      .mockResolvedValue(jsonResponse(401, { error: { code: "UNAUTHENTICATED" } }));
    const hooks = {
      getAccessToken: vi.fn().mockReturnValue("expired"),
      ensureSession: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue("transient"),
      onSessionLost: vi.fn(),
    };

    const response = await runWithSessionRetry(execute, hooks);
    expect(response.status).toBe(401);
    expect(hooks.onSessionLost).not.toHaveBeenCalled();
    expect(execute).toHaveBeenCalledOnce();
  });

  it("clears the session when refresh fails", async () => {
    const execute = vi
      .fn()
      .mockResolvedValue(jsonResponse(401, { error: { code: "UNAUTHENTICATED" } }));
    const hooks = {
      getAccessToken: vi.fn().mockReturnValueOnce("expired").mockReturnValue(null),
      ensureSession: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue(false),
      onSessionLost: vi.fn(),
    };

    const response = await runWithSessionRetry(execute, hooks);
    expect(response.status).toBe(401);
    expect(hooks.onSessionLost).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledOnce();
  });

  it("single-flights concurrent expired calls through one refresh", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: "UNAUTHENTICATED" } }))
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: "UNAUTHENTICATED" } }))
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: "UNAUTHENTICATED" } }))
      .mockResolvedValue(jsonResponse(200, { data: { ok: true } }));
    let currentToken = "expired";
    let resolveRefresh: ((value: boolean) => void) | undefined;
    const refreshSession = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    const hooks = {
      getAccessToken: vi.fn(() => currentToken),
      ensureSession: vi.fn(),
      refreshSession,
      onSessionLost: vi.fn(),
    };

    const pending = Promise.all([
      runWithSessionRetry(execute, hooks),
      runWithSessionRetry(execute, hooks),
      runWithSessionRetry(execute, hooks),
    ]);
    await vi.waitFor(() => expect(refreshSession).toHaveBeenCalledOnce());
    currentToken = "fresh";
    resolveRefresh?.(true);
    const responses = await pending;
    expect(responses.map((item) => item.status)).toEqual([200, 200, 200]);
    expect(hooks.onSessionLost).not.toHaveBeenCalled();
  });

  it("requests re-authentication when restoration cannot recover a credential", async () => {
    const execute = vi.fn();
    const hooks = {
      getAccessToken: vi.fn().mockReturnValue(null),
      ensureSession: vi.fn().mockResolvedValue(null),
      refreshSession: vi.fn(),
      onSessionLost: vi.fn(),
    };

    await expect(runWithSessionRetry(execute, hooks)).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHENTICATED",
    });
    expect(hooks.onSessionLost).toHaveBeenCalledOnce();
    expect(execute).not.toHaveBeenCalled();
  });

  it("does not refresh on 403", async () => {
    const execute = vi
      .fn()
      .mockResolvedValue(jsonResponse(403, { error: { code: "FORBIDDEN" } }));
    const hooks = {
      getAccessToken: vi.fn().mockReturnValue("token"),
      ensureSession: vi.fn(),
      refreshSession: vi.fn(),
      onSessionLost: vi.fn(),
    };

    const response = await runWithSessionRetry(execute, hooks);
    expect(response.status).toBe(403);
    expect(hooks.refreshSession).not.toHaveBeenCalled();
    expect(hooks.onSessionLost).not.toHaveBeenCalled();
  });
});

describe("sessionAwareFetch", () => {
  it("applies a timeout signal and retries through session hooks", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(200, { data: { ok: true } }),
    );
    const hooks = {
      getAccessToken: vi.fn().mockReturnValue("token"),
      ensureSession: vi.fn(),
      refreshSession: vi.fn(),
      onSessionLost: vi.fn(),
    };
    const { sessionAwareFetch } = await import("./session-retry.js");
    const response = await sessionAwareFetch("/api/v1/me", { method: "GET" }, hooks);
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.signal).toBeDefined();
    fetchMock.mockRestore();
  });
});
