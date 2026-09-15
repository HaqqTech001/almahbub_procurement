import { describe, expect, it, vi } from "vitest";
import { AuthRepository } from "./auth-repository.js";
import type { DatabaseClient } from "../../../../shared/database/database-client.js";
function setup(now: Date, failures: Date[]) {
 const queries: string[] = [];
 const tx = {
  $queryRaw: vi.fn(async (sql: { strings: string[] }) => {
   const text = sql.strings.join("?"); queries.push(text);
   if (text.includes("clock_timestamp")) return [{ now }];
   if (text.includes('AS "createdAt"')) return failures.map(createdAt => ({ createdAt }));
   return [];
  }),
  $executeRaw: vi.fn(async () => 1),
  loginEvent: { create: vi.fn(async () => ({ id: "00000000-0000-0000-0000-000000000001" })) },
 };
 const database = { $transaction: vi.fn(async (work: (transaction: typeof tx) => unknown) => work(tx)) };
 return { repository: new AuthRepository(database as unknown as DatabaseClient), tx, queries };
}
const input = { userId: "00000000-0000-0000-0000-000000000001", passwordValid: false, threshold: 5, windowSeconds: 900 };
describe("PostgreSQL password lock persistence", () => {
 it("serializes checks and counts only real failures after the last success", async () => {
  const { repository, queries, tx } = setup(new Date(), []);
  await repository.checkPasswordAttempt(input);
  expect(queries[0]).toContain("FOR UPDATE");
  expect(queries[2]).toContain("outcome = 'failure'");
  expect(queries[2]).toContain("type = 'sign_in' AND outcome = 'success'");
  expect(tx.loginEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ outcome: "failure" }) }));
  expect(tx.$executeRaw).toHaveBeenCalledOnce();
 });
 it("audits blocked retries without adding genuine failures", async () => {
  const now = new Date(); const failures = Array.from({ length: 5 }, () => new Date(now.getTime() - 1000));
  const { repository, tx } = setup(now, failures);
  const result = await repository.checkPasswordAttempt(input);
  expect(result.lockedUntil?.getTime()).toBe(now.getTime() + 899000);
  expect(tx.loginEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ outcome: "blocked" }) }));
 });
 it("allows correct credentials exactly at expiry without writing a failure", async () => {
  const now = new Date(); const { repository, tx } = setup(now, Array.from({ length: 5 }, () => new Date(now.getTime() - 900000)));
  expect((await repository.checkPasswordAttempt({ ...input, passwordValid: true })).lockedUntil).toBeNull();
  expect(tx.loginEvent.create).not.toHaveBeenCalled();
 });
 it("serializes successful sign-in reset with attempts", async () => {
  const { repository, queries, tx } = setup(new Date(), []);
  await repository.recordLoginEvent({ userId: input.userId, type: "sign_in", outcome: "success" });
  expect(queries[0]).toContain("FOR UPDATE"); expect(tx.$executeRaw).toHaveBeenCalledOnce();
 });
});
