import type { NextFunction, Request, RequestHandler, Response } from "express";
import { randomUUID } from "node:crypto";

import { AppError } from "../lib/app-error.js";
import type { RedisClient } from "../shared/cache/redis-client.js";
import { createRateLimiter, type RateLimitOptions } from "./rate-limit.js";
import { apiRateLimitKey, authRateLimitKey } from "./auth-rate-limit-scope.js";

/** Atomic sliding window. Rejected requests neither add an entry nor renew TTL. */
export const RATE_LIMIT_SCRIPT = `
local key = KEYS[1]
local clock = redis.call('TIME')
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
local window = tonumber(ARGV[1])
local maximum = tonumber(ARGV[2])
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
local count = redis.call('ZCARD', key)
if count >= maximum then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  return {0, math.max(1, math.ceil((tonumber(oldest[2]) + window - now) / 1000))}
end
redis.call('ZADD', key, now, ARGV[3])
redis.call('PEXPIRE', key, window)
return {1, 0}
`;

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
    if (request.method === "OPTIONS") { next(); return; }
    const key = `${prefix}:${keyFn(request)}`;
    try {
      const result = await redis.eval(RATE_LIMIT_SCRIPT, 1, key, options.windowMs, options.limit, randomUUID());
      if (!Array.isArray(result) || result.length !== 2 || ![0, 1].includes(Number(result[0])) || !Number.isFinite(Number(result[1]))) throw new Error("Invalid rate-limit result");
      if (Number(result[0]) === 0) {
        response.setHeader(
          "Retry-After",
          String(Math.max(1, Number(result[1]))),
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
      // Keep the process fallback warm; Redis remains authoritative across nodes.
      memory(request, response, next);
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
      prefix: "rl:auth:v2",
      key: authRateLimitKey,
      limit: 20,
      windowMs: 15 * 60_000,
      code: "AUTH_RATE_LIMITED",
      message: "Requests to this authentication endpoint are temporarily limited. Please retry shortly.",
    }),
    api: createRedisRateLimiter({
      redis,
      prefix: "rl:api:v2",
      key: apiRateLimitKey,
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
