import { describe, expect, it, vi } from "vitest";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import { WeddingParticipationService } from "./wedding-participation-service.js";

const auth: AuthContext = { userId: "user", organizationId: "org", membershipId: "member", sessionId: "session", permissionKeys: new Set() };
function setup(verified = true) {
  const rows: Record<string, Record<string, unknown> | undefined> = {};
  const delegate = (kind: string, flag: string) => ({
    findUnique: vi.fn(async () => rows[kind] ?? null),
    findMany: vi.fn(async () => rows[kind] ? [{ ...rows[kind], user: { displayName: null, firstName: "Test", lastName: "Guest" } }] : []),
    count: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
      const row = rows[kind];
      return row && (where[flag] === undefined || row[flag] === where[flag]) ? 1 : 0;
    }),
    upsert: vi.fn(async () => rows[kind] ??= { id: kind, [flag]: false }),
    updateMany: vi.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      const row = rows[kind];
      if (!row || (where[flag] !== undefined && row[flag] !== where[flag])) return { count: 0 };
      Object.assign(row, data);
      return { count: 1 };
    }),
  });
  const db = {
    user: { findUnique: vi.fn(async () => ({ emailVerifiedAt: verified ? new Date() : null })) },
    weddingCampaign: { findUnique: vi.fn(async () => ({ id: "campaign" })), upsert: vi.fn(async () => ({})) },
    weddingSubscription: delegate("subscription", "enabled"),
    weddingWaitingMembership: delegate("waiting", "joined"),
    auditEvent: { create: vi.fn(async () => ({})) },
    $transaction: vi.fn(async (run: (tx: unknown) => unknown) => run(db)),
  };
  return { service: new WeddingParticipationService(db as unknown as DatabaseClient), db, rows };
}

describe("Wedding participation", () => {
  it("keeps subscriptions separate, idempotent, and retains opt-out audit history", async () => {
    const { service, db, rows } = setup();
    expect(await service.change(auth, "subscription", true)).toEqual({ subscribed: true, joined: false });
    const subscribedAt = rows.subscription?.subscribedAt;
    await service.change(auth, "subscription", true);
    expect(rows.subscription?.subscribedAt).toBe(subscribedAt);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
    expect(await service.change(auth, "subscription", false)).toEqual({ subscribed: false, joined: false });
    expect(rows.subscription?.unsubscribedAt).toBeInstanceOf(Date);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(2);
  });
  it("requires verified email for subscribing but permits joining and leaving", async () => {
    const { service } = setup(false);
    await expect(service.change(auth, "subscription", true)).rejects.toMatchObject({ statusCode: 403 });
    expect(await service.change(auth, "waiting", true)).toEqual({ subscribed: false, joined: true });
    expect(await service.change(auth, "subscription", false)).toEqual({ subscribed: false, joined: true });
  });
  it("retains join/leave/rejoin history and never rejoins through a heartbeat", async () => {
    const { service, rows, db } = setup();
    await service.change(auth, "waiting", true);
    await service.change(auth, "waiting", true);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
    await service.change(auth, "waiting", false);
    const lastSeenAt = rows.waiting?.lastSeenAt;
    expect(await service.heartbeat(auth.userId)).toEqual({ joined: false, subscribed: false });
    expect(rows.waiting?.lastSeenAt).toBe(lastSeenAt);
    await service.change(auth, "waiting", true);
    expect(rows.waiting?.leftAt).toBeInstanceOf(Date);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(3);
  });
});

describe("Participant listing and lifecycle", () => {
 it.each(["subscription", "waiting"] as const)("returns valid empty %s pagination", async kind => {
  const {service}=setup();
  expect(await service.list(kind,1)).toEqual({page:1,total:0,enabled:0,active:0,items:[]});
 });
 it("queries the logical campaign, paginates and keeps each kind separate", async () => {
  const {service,db}=setup();
  await service.list("subscription",2);
  expect(db.weddingSubscription.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{campaignId:"founder-wedding-september-2026"},skip:50,take:50}));
  expect(db.weddingWaitingMembership.findMany).not.toHaveBeenCalled();
 });
 it("reflects subscribe, reload, unsubscribe and waiting join/leave/rejoin independently", async () => {
  const {service,db}=setup();
  await service.change(auth,"subscription",true);
  const reloaded = new WeddingParticipationService(db as unknown as DatabaseClient);
  expect(await reloaded.state(auth.userId)).toEqual({subscribed:true,joined:false});
  expect((await reloaded.list("subscription",1)).enabled).toBe(1);
  expect((await reloaded.list("waiting",1)).total).toBe(0);
  await reloaded.change(auth,"subscription",false);
  expect(await reloaded.list("subscription",1)).toMatchObject({total:1,enabled:0});
  await reloaded.change(auth,"waiting",true);
  expect((await service.list("waiting",1)).enabled).toBe(1);
  await reloaded.change(auth,"waiting",false);
  expect(await service.list("waiting",1)).toMatchObject({total:1,enabled:0});
  await reloaded.change(auth,"waiting",true);
  expect((await service.state(auth.userId)).joined).toBe(true);
 });
});
