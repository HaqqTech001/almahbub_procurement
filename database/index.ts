/**
 * Public database package surface.
 *
 * Runtime connection ownership belongs to the API composition root. This
 * package exposes a factory rather than constructing a process-wide client or
 * reading environment values.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "./generated/client/client.js";

export * from "./generated/client/client.js";

function errorText(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const candidate = error as {
    code?: string;
    message?: string;
    meta?: {
      driverAdapterError?: {
        cause?: { kind?: string; message?: string; originalMessage?: string };
      };
    };
  };
  return [
    candidate.code,
    candidate.message,
    candidate.meta?.driverAdapterError?.cause?.kind,
    candidate.meta?.driverAdapterError?.cause?.message,
    candidate.meta?.driverAdapterError?.cause?.originalMessage,
  ]
    .filter(Boolean)
    .join(" ");
}

export function isStaleConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    code?: string;
    meta?: { driverAdapterError?: { cause?: { kind?: string } } };
  };
  if (candidate.code === "P1017") return true;
  if (candidate.meta?.driverAdapterError?.cause?.kind === "ConnectionClosed") {
    return true;
  }
  const text = errorText(error);
  return (
    text.includes("Server has closed the connection") ||
    text.includes("Connection terminated unexpectedly") ||
    text.includes("Connection terminated")
  );
}

export function isPoolExhaustedError(error: unknown): boolean {
  const text = errorText(error);
  return (
    text.includes("EMAXCONNSESSION") ||
    text.includes("max clients reached") ||
    text.includes("P2039")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Build a Prisma client backed by an explicit `pg` pool.
 * keepAlive + bounded idle timeout reduce P1017 "Server has closed the
 * connection" failures against Supabase / PgBouncer poolers. One automatic
 * retry recovers the first query after a remote idle drop.
 */
export function createDatabaseClient(connectionString: string): PrismaClient {
  const configured = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "", 10);
  const max = Number.isFinite(configured) && configured > 0 ? configured : 3;
  const pool = new pg.Pool({
    connectionString,
    // Session-mode poolers (Supabase) often allow ~15 clients total. Keep this
    // small so tsx watch / extra scripts cannot exhaust the remote pool.
    max,
    idleTimeoutMillis: 8_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    allowExitOnIdle: true,
  });

  pool.on("error", (error: Error) => {
    // Prevent unhandled 'error' on idle clients from crashing the process.
    console.error("[database-pool] idle connection error", {
      code: (error as Error & { code?: string }).code ?? "UNKNOWN",
    });
  });

  const client = new PrismaClient({
    adapter: new PrismaPg(pool, { disposeExternalPool: true }),
  });

  return client.$extends({
    query: {
      async $allOperations({ args, query, operation }) {
        try {
          return await query(args);
        } catch (error) {
          // A connection can disappear after a write committed. Never replay
          // mutations or raw SQL with an unknown outcome.
          if (
            !/^(findUnique|findUniqueOrThrow|findFirst|findFirstOrThrow|findMany|count|aggregate|groupBy)$/.test(
              operation,
            )
          )
            throw error;
          if (isPoolExhaustedError(error)) {
            await sleep(250);
            try {
              return await query(args);
            } catch (retryError) {
              if (!isPoolExhaustedError(retryError)) throw retryError;
              await sleep(750);
              return query(args);
            }
          }
          if (!isStaleConnectionError(error)) throw error;
          await sleep(250);
          try {
            return await query(args);
          } catch (retryError) {
            if (!isStaleConnectionError(retryError)) throw retryError;
            await sleep(750);
            return query(args);
          }
        }
      },
    },
  }) as unknown as PrismaClient;
}
