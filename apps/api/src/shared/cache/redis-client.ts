import { Redis } from "ioredis";

import type { Environment } from "../../config/env.js";

export type RedisClient = Redis;

export function createRedisClient(environment: Environment): RedisClient {
  if (!environment.REDIS_URL) {
    throw new Error("REDIS_URL is required to create a Redis client.");
  }

  return new Redis(environment.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
}
