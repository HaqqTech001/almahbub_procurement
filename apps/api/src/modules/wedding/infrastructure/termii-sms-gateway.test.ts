import { describe, expect, it, vi } from "vitest";

import { parseEnvironment } from "../../../config/env.js";
import { TermiiSmsGateway, createTermiiSmsGateway } from "./termii-sms-gateway.js";

describe("TermiiSmsGateway", () => {
  it("uses TERMII_SENDER_ID from configuration and does not substitute another brand", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message_id: "msg-1" }),
    });
    const gateway = new TermiiSmsGateway(
      "secret-key",
      "https://api.ng.termii.com",
      "ALMAHBUB",
      fetchImpl as unknown as typeof fetch,
    );
    const result = await gateway.sendDetailed({ to: "+2348012345678", body: "Live now" });
    expect(result.ok).toBe(true);
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as {
      from: string;
      api_key: string;
      channel: string;
    };
    expect(body.from).toBe("ALMAHBUB");
    expect(body.channel).toBe("generic");
    expect(body.api_key).toBe("secret-key");
  });

  it("fails closed when the configured sender is unusable", async () => {
    const fetchImpl = vi.fn();
    const gateway = new TermiiSmsGateway("secret-key", "https://api.ng.termii.com", "AB", fetchImpl);
    const result = await gateway.sendDetailed({ to: "+2348012345678", body: "Live now" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("TERMII_SENDER_INVALID");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("does not construct a gateway without env credentials", () => {
    const gateway = createTermiiSmsGateway(parseEnvironment({ NODE_ENV: "test" }));
    expect(gateway).toBeUndefined();
  });
});
