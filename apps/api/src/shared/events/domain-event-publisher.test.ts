import { describe, expect, it, vi } from "vitest";

import { publishDomainEvent } from "./domain-event-publisher.js";

describe("publishDomainEvent", () => {
  it("writes a v1 outbox envelope without requiring callers to pass version", async () => {
    const create = vi.fn().mockResolvedValue(undefined);
    const transaction = {
      outboxEvent: { create },
    } as never;

    await publishDomainEvent(transaction, {
      name: "procurement.requested",
      organizationId: "019ff78f-3904-74b8-9a84-7fa176447ed6",
      aggregate: {
        type: "procurement_request",
        id: "019ff78f-3904-74b8-9a84-7fa176447ed7",
      },
      actor: { type: "user", id: "019ff78f-3904-74b8-9a84-7fa176447ed8" },
      correlationId: "019ff78f-3904-74b8-9a84-7fa176447ed9",
      payload: {
        requestId: "019ff78f-3904-74b8-9a84-7fa176447ed7",
        status: "submitted",
      },
      legacyEventType: "procurement.request.submitted",
    });

    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0]?.[0]?.data as {
      eventVersion: number;
      eventType: string;
      eventName: string;
      metadata: { schemaVersion: number };
    };
    expect(data.eventVersion).toBe(1);
    expect(data.eventName).toBe("procurement.requested");
    expect(data.eventType).toBe("procurement.request.submitted");
    expect(data.metadata).toEqual({ schemaVersion: 1 });
  });
});
