import type { NextFunction, Request, RequestHandler, Response } from "express";

import { AppError } from "../lib/app-error.js";
import type { RedisClient } from "../shared/cache/redis-client.js";
import { createRateLimiter, type RateLimitOptions } from "./rate-limit.js";

export type RedisRateLimitOptions = RateLimitOptions & {
  /** Redis client; falls back to in-memory when unavailable. */
  redis?: RedisClient | undefined;
  /** Key namespace for Redis. */
  prefix?: string;
};

/**
 * Redis sliding-window rate limiter with in-memory fallback.
 * Used for distributed abuse protection when REDIS_URL is configured.
 */
export function createRedisRateLimiter(
  options: RedisRateLimitOptions,
): RequestHandler {
  const memory = createRateLimiter(options);
  const redis = options.redis;
  if (!redis) return memory;

  const code = options.code ?? "RATE_LIMITED";
  const message =
    options.message ?? "Too many requests. Please retry shortly.";
  const prefix = options.prefix ?? "rl";
  const keyFn =
    options.key ??
    ((request: Request) =>
      request.ip || request.socket.remoteAddress || "unknown");

  return async (request: Request, response: Response, next: NextFunction) => {
    const key = `${prefix}:${keyFn(request)}`;
    try {
      const now = Date.now();
      const windowStart = now - options.windowMs;
      const multi = redis.multi();
      multi.zremrangebyscore(key, 0, windowStart);
      multi.zadd(key, now, `${now}:${Math.random().toString(36).slice(2)}`);
      multi.zcard(key);
      multi.pexpire(key, options.windowMs);
      const results = await multi.exec();
      const count = Number(results?.[2]?.[1] ?? 0);

      if (count > options.limit) {
        response.setHeader(
          "Retry-After",
          String(Math.ceil(options.windowMs / 1000)),
        );
        next(
          new AppError({
            statusCode: 429,
            code,
            message,
          }),
        );
        return;
      }
      next();
    } catch {
      memory(request, response, next);
    }
  };
}

export function createApiAbuseLimiters(redis?: RedisClient): {
  auth: RequestHandler;
  api: RequestHandler;
  ai: RequestHandler;
  marketing: RequestHandler;
} {
  return {
    auth: createRedisRateLimiter({
      redis,
      prefix: "rl:auth",
      limit: 20,
      windowMs: 15 * 60_000,
      code: "AUTH_RATE_LIMITED",
      message: "Too many authentication attempts. Please retry shortly.",
    }),
    api: createRedisRateLimiter({
      redis,
      prefix: "rl:api",
      limit: 300,
      windowMs: 60_000,
      code: "API_RATE_LIMITED",
      message: "Too many API requests. Please retry shortly.",
    }),
    ai: createRedisRateLimiter({
      redis,
      prefix: "rl:ai",
      limit: 30,
      windowMs: 60_000,
      code: "AI_RATE_LIMITED",
      message: "Too many AI requests. Please retry shortly.",
    }),
    marketing: createRedisRateLimiter({
      redis,
      prefix: "rl:marketing",
      limit: 10,
      windowMs: 15 * 60_000,
      code: "MARKETING_RATE_LIMITED",
      message: "Too many contact submissions. Please retry shortly.",
    }),
  };
}
