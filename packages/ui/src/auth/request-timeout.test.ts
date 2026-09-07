import { describe, expect, it, vi } from "vitest";

import {
  CancelledRequestError,
  createFetchGate,
  isAbortError,
  isCancelledRequest,
  readResponseBody,
  runMutationThenRefresh,
  signalWithTimeout,
  timeoutMsForMethod,
  unwrapEnvelopeData,
  userFacingRequestError,
} from "./request-timeout.js";

describe("request timeout helpers", () => {
  it("aborts when the caller signal fires", () => {
    const controller = new AbortController();
    const signal = signalWithTimeout(controller.signal, 60_000);
    expect(signal.aborted).toBe(false);
    controller.abort();
    expect(signal.aborted).toBe(true);
  });

  it("recognises abort errors so loading can settle", () => {
    expect(isAbortError(new DOMException("Aborted", "AbortError"))).toBe(true);
    expect(isAbortError(new Error("network"))).toBe(false);
  });

  it("does not treat cancellation as a user-facing error", () => {
    expect(isCancelledRequest(new DOMException("Aborted", "AbortError"))).toBe(true);
    expect(userFacingRequestError(new CancelledRequestError(), "Unexpected error")).toBeNull();
    expect(userFacingRequestError(new Error("network"), "Unexpected error")).toBe("network");
  });

  it("does not parse a 204 body", async () => {
    await expect(readResponseBody(new Response(null, { status: 204 }))).resolves.toBeNull();
  });

  it("does not parse a 205 body", async () => {
    await expect(readResponseBody(new Response(null, { status: 205 }))).resolves.toBeNull();
  });

  it("returns null for an empty successful body", async () => {
    await expect(
      readResponseBody(new Response("", { status: 200, headers: { "Content-Length": "0" } })),
    ).resolves.toBeNull();
  });

  it("parses a normal JSON object", async () => {
    const body = await readResponseBody(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(body).toEqual({ ok: true });
  });

  it("unwraps an envelope response", () => {
    expect(unwrapEnvelopeData({ data: { id: "1" } })).toEqual({ id: "1" });
  });

  it("uses a longer timeout for mutations than for GET", () => {
    expect(timeoutMsForMethod("GET")).toBeLessThan(timeoutMsForMethod("POST"));
  });

  it("drops stale fetch generations so older errors cannot overwrite new data", () => {
    const gate = createFetchGate();
    const first = gate.next();
    const second = gate.next();
    expect(gate.isCurrent(first)).toBe(false);
    expect(gate.isCurrent(second)).toBe(true);
  });

  it("keeps a successful mutation when the secondary refresh fails", async () => {
    const mutate = vi.fn().mockResolvedValue({ id: "saved" });
    const refresh = vi.fn().mockRejectedValue(new Error("Couldn't load request"));
    const outcome = await runMutationThenRefresh({ mutate, refresh });
    expect(outcome.result).toEqual({ id: "saved" });
    expect(outcome.refreshError).toBeInstanceOf(Error);
    expect(userFacingRequestError(outcome.refreshError, "Unable to save")).not.toBe(
      "Unable to save",
    );
  });

  it("does not treat an intentional abort as a mutation failure", async () => {
    const mutate = vi.fn().mockResolvedValue({ id: "saved" });
    const refresh = vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError"));
    const outcome = await runMutationThenRefresh({ mutate, refresh });
    expect(outcome.result).toEqual({ id: "saved" });
    expect(outcome.refreshError).toBeNull();
    expect(userFacingRequestError(new DOMException("Aborted", "AbortError"), "Unexpected error")).toBeNull();
  });

  it("retries a transient GET 500 once then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("fail", { status: 500 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    const { fetchWithTransientRetry } = await import("./request-timeout.js");
    const response = await fetchWithTransientRetry("/api/v1/categories", { method: "GET" }, fetchImpl);
    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 404", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("missing", { status: 404 }));
    const { fetchWithTransientRetry } = await import("./request-timeout.js");
    const response = await fetchWithTransientRetry("/api/v1/products/x", { method: "GET" }, fetchImpl);
    expect(response.status).toBe(404);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not retry a POST", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("fail", { status: 500 }));
    const { fetchWithTransientRetry } = await import("./request-timeout.js");
    const response = await fetchWithTransientRetry("/api/v1/auth/login", { method: "POST" }, fetchImpl);
    expect(response.status).toBe(500);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
