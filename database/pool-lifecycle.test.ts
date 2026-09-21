import { describe, expect, it, vi, afterEach } from "vitest";
const state = vi.hoisted(() => ({
  options: {} as Record<string, unknown>,
  extension: null as unknown,
}));
vi.mock("pg", () => ({
  default: {
    Pool: class {
      on = vi.fn();
    },
  },
}));
vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class {
    constructor(_pool: unknown, options: Record<string, unknown>) {
      state.options = options;
    }
  },
}));
vi.mock("./generated/client/client.js", () => ({
  PrismaClient: class {
    $extends(extension: unknown) {
      state.extension = extension;
      return this;
    }
  },
}));
import { createDatabaseClient } from "./index.js";
type Extension = {
  query: {
    $allOperations(input: {
      operation: string;
      args: object;
      query: (args: object) => Promise<unknown>;
    }): Promise<unknown>;
  };
};
afterEach(() => vi.useRealTimers());
describe("database pool ownership and retry safety", () => {
  it("disposes the factory-owned external pool on Prisma disconnect", () => {
    createDatabaseClient("postgresql://unused");
    expect(state.options.disposeExternalPool).toBe(true);
  });
  it("does not replay writes or raw statements after disconnect", async () => {
    createDatabaseClient("postgresql://unused");
    for (const operation of [
      "create",
      "update",
      "upsert",
      "delete",
      "$executeRaw",
      "$queryRaw",
    ]) {
      const query = vi.fn().mockRejectedValue({ code: "P1017" });
      await expect(
        (state.extension as Extension).query.$allOperations({
          operation,
          args: {},
          query,
        }),
      ).rejects.toEqual({ code: "P1017" });
      expect(query).toHaveBeenCalledTimes(1);
    }
  });
  it("bounds safe read retries to three attempts", async () => {
    vi.useFakeTimers();
    createDatabaseClient("postgresql://unused");
    const query = vi.fn().mockRejectedValue({ code: "P1017" });
    const result = (state.extension as Extension).query.$allOperations({
      operation: "findMany",
      args: {},
      query,
    });
    const assertion = expect(result).rejects.toEqual({ code: "P1017" });
    await vi.runAllTimersAsync();
    await assertion;
    expect(query).toHaveBeenCalledTimes(3);
  });
});
