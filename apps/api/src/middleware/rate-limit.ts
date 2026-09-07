import type { NextFunction, Request, RequestHandler, Response } from "express";

import { AppError } from "../lib/app-error.js";

export type RateLimitOptions = {
  /** Maximum allowed requests in the window. */
  limit: number;
  /** Sliding window length in milliseconds. */
  windowMs: number;
  /** Key selector; defaults to client IP. */
  key?: (request: Request) => string;
  /** Stable error code for clients/monitoring. */
  code?: string;
  /** Human-readable message. */
  message?: string;
};

type Bucket = {
  timestamps: number[];
};

/**
 * In-process sliding-window rate limiter for abuse-sensitive routes
 * (login/refresh). Production hosts should front this with edge/gateway
 * limits; this protects the Node process when Redis is unavailable.
 */
export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, Bucket>();
  const code = options.code ?? "RATE_LIMITED";
  const message =
    options.message ?? "Too many requests. Please retry shortly.";
  const keyFn =
    options.key ??
    ((request: Request) =>
      request.ip || request.socket.remoteAddress || "unknown");
  const maxKeys = 10_000;

  return (request: Request, response: Response, next: NextFunction) => {
    const now = Date.now();
    const key = keyFn(request);
    const bucket = buckets.get(key) ?? { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter(
      (ts) => now - ts < options.windowMs,
    );

    if (bucket.timestamps.length >= options.limit) {
      const oldest = bucket.timestamps[0] ?? now;
      const retryAfterSec = Math.max(
        1,
        Math.ceil((options.windowMs - (now - oldest)) / 1000),
      );
      response.setHeader("Retry-After", String(retryAfterSec));
      buckets.set(key, bucket);
      next(
        new AppError({
          statusCode: 429,
          code,
          message,
        }),
      );
      return;
    }

    bucket.timestamps.push(now);
    buckets.set(key, bucket);

    if (buckets.size > maxKeys) {
      const overflow = buckets.size - maxKeys;
      let removed = 0;
      for (const existing of buckets.keys()) {
        if (existing === key) continue;
        buckets.delete(existing);
        removed += 1;
        if (removed >= overflow) break;
      }
    }

    next();
  };
}

/** Auth login/refresh defaults: 20 attempts / 15 minutes per IP. */
export const authAbuseLimiter: RequestHandler = createRateLimiter({
  limit: 20,
  windowMs: 15 * 60_000,
  code: "AUTH_RATE_LIMITED",
  message: "Too many authentication attempts. Please retry shortly.",
});
