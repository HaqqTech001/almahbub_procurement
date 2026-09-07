import { describe, expect, it } from "vitest";

import {
  orderAdviseSchema,
  productAdviseSchema,
  quotationCompareSchema,
  requestDraftGuidanceSchema,
} from "../api/copilot-schemas.js";
import { parseCopilotJson } from "../application/copilot-prompts.js";
import { createLlmProvider } from "../providers/create-llm-gateway.js";
import { CopilotService } from "../application/copilot-service.js";
import type { AppError } from "../../../lib/app-error.js";

describe("copilot schemas", () => {
  it("requires a product identity for product advise", () => {
    expect(() => productAdviseSchema.parse({})).toThrow();
    expect(
      productAdviseSchema.parse({
        product: { slug: "industrial-components", name: "Industrial components" },
      }).focus,
    ).toBe("all");
  });

  it("requires at least two quotation ids to compare", () => {
    expect(() =>
      quotationCompareSchema.parse({ quotationIds: ["11111111-1111-1111-1111-111111111111"] }),
    ).toThrow();
  });

  it("requires an order record id", () => {
    expect(() => orderAdviseSchema.parse({})).toThrow();
    expect(
      orderAdviseSchema.parse({
        shipmentId: "11111111-1111-1111-1111-111111111111",
      }).focus,
    ).toBe("all");
  });

  it("accepts draft request guidance payloads", () => {
    const parsed = requestDraftGuidanceSchema.parse({
      draft: { title: "RFQ pumps", items: [{ description: "Pump", quantity: 2 }] },
    });
    expect(parsed.focus).toBe("all");
  });
});

describe("parseCopilotJson", () => {
  it("parses fenced JSON responses", () => {
    const parsed = parseCopilotJson(`\`\`\`json
{"answer":"ok","confidence":"high","assumptions":[],"missingData":["MOQ"],"nextActions":["Ask ops"],"structured":{"a":1}}
\`\`\``);
    expect(parsed.answer).toBe("ok");
    expect(parsed.missingData).toEqual(["MOQ"]);
    expect(parsed.structured).toEqual({ a: 1 });
  });
});

describe("createLlmProvider", () => {
  it("returns null when no vendor credentials are configured", () => {
    expect(
      createLlmProvider({
        defaultProvider: "none",
        openaiModel: "gpt-4o-mini",
        anthropicModel: "claude",
        geminiModel: "gemini",
      }),
    ).toBeNull();
  });

  it("selects OpenAI when key is present", () => {
    const provider = createLlmProvider({
      defaultProvider: "none",
      openaiApiKey: "sk-test",
      openaiModel: "gpt-4o-mini",
      anthropicModel: "claude",
      geminiModel: "gemini",
    });
    expect(provider?.id).toBe("openai");
    expect(provider?.model).toBe("gpt-4o-mini");
  });

  it("honors an explicit anthropic default", () => {
    const provider = createLlmProvider({
      defaultProvider: "anthropic",
      anthropicApiKey: "ant-test",
      openaiModel: "gpt-4o-mini",
      anthropicModel: "claude-sonnet",
      geminiModel: "gemini",
    });
    expect(provider?.id).toBe("anthropic");
  });
});

describe("CopilotService without provider", () => {
  it("reports offline status and refuses workflow calls", async () => {
    const service = new CopilotService({} as never, null);
    expect(service.status().configured).toBe(false);
    await expect(
      service.adviseProduct(
        {
          userId: "u",
          organizationId: "o",
          permissionKeys: new Set(["ai:use"]),
        } as never,
        {
          mode: "explain",
          focus: "explain",
          product: { slug: "x", name: "X" },
        },
      ),
    ).rejects.toMatchObject({
      code: "AI_NOT_CONFIGURED",
    } satisfies Partial<AppError>);
  });
});
