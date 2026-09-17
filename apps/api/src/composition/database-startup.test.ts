import { afterEach, describe, expect, it, vi } from "vitest";
import { checkDatabaseBeforeBootstrap } from "./database-startup.js";

afterEach(() => vi.useRealTimers());
describe("database startup probe", () => {
  it("recovers a transient cold connection before permitting bootstrap", async () => {
    vi.useFakeTimers();
    const probe = vi.fn().mockRejectedValueOnce({ code: "P1001" }).mockResolvedValue(1);
    const result = checkDatabaseBeforeBootstrap(probe);
    await vi.runAllTimersAsync();
    await result;
    expect(probe).toHaveBeenCalledTimes(2);
  });
  it("stops after three connection failures with a useful diagnostic", async () => {
    vi.useFakeTimers();
    const probe = vi.fn().mockRejectedValue(new Error("Connection terminated due to connection timeout"));
    const result = expect(checkDatabaseBeforeBootstrap(probe)).rejects.toThrow("no bootstrap transaction was started");
    await vi.runAllTimersAsync();
    await result;
    expect(probe).toHaveBeenCalledTimes(3);
  });
  it.each(["P1000", "P2021", "P2028"])("does not retry authentication, schema or transaction errors (%s)", async code => {
    const error = { code };
    const probe = vi.fn().mockRejectedValue(error);
    await expect(checkDatabaseBeforeBootstrap(probe)).rejects.toBe(error);
    expect(probe).toHaveBeenCalledOnce();
  });
});
