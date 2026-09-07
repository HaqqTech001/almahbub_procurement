import type { Environment } from "../config/env.js";
import {
  createRedisClient,
  type RedisClient,
} from "../shared/cache/redis-client.js";
import {
  createApiDatabaseClient,
  type DatabaseClient,
} from "../shared/database/database-client.js";

export interface ApiDependencies {
  readonly database?: DatabaseClient;
  readonly redis?: RedisClient;
}

export interface ReadinessDependencies {
  readonly database?: () => Promise<void>;
  readonly redis?: () => Promise<void>;
}

export function createApiDependencies(
  environment: Environment,
): ApiDependencies {
  return {
    ...(environment.DATABASE_URL
      ? { database: createApiDatabaseClient(environment.DATABASE_URL) }
      : {}),
    ...(environment.REDIS_URL ? { redis: createRedisClient(environment) } : {}),
  };
}

export function createReadinessDependencies(
  dependencies: ApiDependencies,
): ReadinessDependencies {
  const { database, redis } = dependencies;

  return {
    ...(database
      ? {
          database: async () => {
            await database.$queryRaw`SELECT 1`;
          },
        }
      : {}),
    ...(redis ? { redis: pingRedis(redis) } : {}),
  };
}

export async function disconnectDependencies(
  dependencies: ApiDependencies,
): Promise<void> {
  await Promise.all([
    dependencies.database?.$disconnect(),
    dependencies.redis?.quit(),
  ]);
}

function pingRedis(redis: RedisClient): () => Promise<void> {
  return async () => {
    await redis.ping();
  };
}
