import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

import { AppError } from "../lib/app-error.js";
import { createRateLimiter } from "./rate-limit.js";

function mockReq(ip = "10.0.0.1"): Request {
  return { ip, socket: { remoteAddress: ip } } as Request;
}

function mockRes(): Response {
  const headers = new Map<string, string>();
  return {
    setHeader: (name: string, value: string) => {
      headers.set(name, value);
    },
    getHeader: (name: string) => headers.get(name),
  } as unknown as Response;
}

describe("createRateLimiter", () => {
  it("allows traffic under the limit and blocks thereafter", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    const next = vi.fn();

    limiter(mockReq(), mockRes(), next);
    limiter(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(next.mock.calls.every((call) => call[0] === undefined)).toBe(true);

    const blockedNext = vi.fn();
    const response = mockRes();
    limiter(mockReq(), response, blockedNext);
    expect(blockedNext).toHaveBeenCalledTimes(1);
    const error = blockedNext.mock.calls[0]?.[0] as AppError;
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe("RATE_LIMITED");
    expect(response.getHeader("Retry-After")).toBeTruthy();
  });

  it("isolates keys by client identity", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    const nextA = vi.fn();
    const nextB = vi.fn();
    limiter(mockReq("1.1.1.1"), mockRes(), nextA);
    limiter(mockReq("2.2.2.2"), mockRes(), nextB);
    expect(nextA.mock.calls[0]?.[0]).toBeUndefined();
    expect(nextB.mock.calls[0]?.[0]).toBeUndefined();
  });
});
