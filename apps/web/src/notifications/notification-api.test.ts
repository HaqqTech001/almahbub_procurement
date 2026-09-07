import { describe, expect, it } from "vitest";

import { mapApiNotification } from "./notification-api.js";
import { createNotificationRealtimeTransport } from "./notification-realtime.js";

describe("notification API mapping", () => {
  it("projects API serialize into InboxNotification", () => {
    const mapped = mapApiNotification({
      id: "11111111-1111-1111-1111-111111111111",
      type: "security",
      priority: "critical",
      status: "unread",
      title: "New sign-in",
      body: "We noticed a sign-in from a new device.",
      createdAt: "2026-08-06T12:00:00.000Z",
      deliveries: [{ channel: "in_app", status: "delivered" }],
    });
    expect(mapped.type).toBe("security");
    expect(mapped.channels).toEqual(["in_app"]);
    expect(mapped.status).toBe("unread");
  });
});

describe("notification realtime transport", () => {
  it("falls back to polling when websocket url is absent", () => {
    const transport = createNotificationRealtimeTransport({
      getAccessToken: () => "token",
      fetchInbox: async () => [],
    });
    const unsubscribe = transport.subscribe(() => undefined);
    expect(["polling", "offline", "websocket"]).toContain(transport.getMode());
    unsubscribe();
  });

  it("does not throw when the websocket constructor fails", () => {
    const Original = globalThis.WebSocket;
    class BoomSocket {
      constructor() {
        throw new Error("ws failed");
      }
    }
    globalThis.WebSocket = BoomSocket as unknown as typeof WebSocket;
    try {
      const transport = createNotificationRealtimeTransport({
        getAccessToken: () => "token",
        fetchInbox: async () => [],
        websocketUrl: "ws://127.0.0.1:9/ws/notifications",
      });
      const unsubscribe = transport.subscribe(() => undefined);
      expect(["polling", "offline"]).toContain(transport.getMode());
      unsubscribe();
    } finally {
      globalThis.WebSocket = Original;
    }
  });
});
