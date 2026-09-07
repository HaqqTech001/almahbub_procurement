import { describe, expect, it } from "vitest";

import {
  createAndMaybeSubmit,
  mapApiProcurementToRecord,
  sanitizeUploadFiles,
  toCreateBody,
  uploadProcurementFiles,
  type ApiProcurementRequest,
} from "./procurement-api.js";

const sample: ApiProcurementRequest = {
  id: "11111111-1111-1111-1111-111111111111",
  publicCode: "PR-1001",
  status: "draft",
  lob: "international",
  title: "Industrial valves",
  currencyCode: "USD",
  notes: "Prefer ISO suppliers",
  destinationCountryCode: "NG",
  destinationAddress: "Lagos warehouse gate 2",
  requiredByDate: "2026-09-01",
  budgetAmount: "12500.50",
  priority: "high",
  restrictedGoodsDeclared: false,
  rowVersion: 3,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-02T00:00:00.000Z",
  items: [
    {
      id: "22222222-2222-2222-2222-222222222222",
      description: "Gate valve DN50",
      quantity: "4",
      unit: "pcs",
      targetUnitAmount: "250",
      productVariantId: null,
    },
  ],
};

describe("procurement API mapping", () => {
  it("maps API decimals and dates into UI records", () => {
    const mapped = mapApiProcurementToRecord(sample);
    expect(mapped.publicCode).toBe("PR-1001");
    expect(mapped.lob).toBe("international");
    expect(mapped.budgetAmount).toBe(12500.5);
    expect(mapped.items[0]?.quantity).toBe(4);
    expect(mapped.items[0]?.targetUnitAmount).toBe(250);
    expect(mapped.timeline).toEqual([]);
    expect(mapped.requesterName).toBe("You");
  });

  it("builds a create body from wizard fields", () => {
    const body = toCreateBody({
      title: "Spare parts",
      currencyCode: "usd",
      notes: "Urgent",
      internalNotes: "Ops only",
      destinationCountryCode: "ng",
      destinationAddress: "Abuja HQ receiving",
      requiredByDate: "2026-10-15",
      budgetAmount: 900,
      priority: "urgent",
      restrictedGoodsDeclared: true,
      items: [
        {
          id: "local-1",
          description: "Bearing SKF",
          quantity: 2,
          unit: "pcs",
          targetUnitAmount: 40,
        },
      ],
      rowVersion: 0,
    });
    expect(body.title).toBe("Spare parts");
    expect(body.currencyCode).toBe("USD");
    expect(body.destinationCountryCode).toBe("NG");
    expect(body.notes).toBe("Urgent");
    expect(body.notes).not.toContain("[Internal]");
    expect(body.items).toHaveLength(1);
    expect(body.internalNotes).toBeUndefined();
    expect(
      toCreateBody({
        title: "IE lot",
        lob: "integrated_export",
        items: [
          {
            id: "local-1",
            description: "TEST COMMODITY ONLY",
            quantity: 1,
            unit: "mt",
          },
        ],
        rowVersion: 0,
      }).lob,
    ).toBe("integrated_export");
  });

  it("rejects submit without a usable destination before calling the API", async () => {
    await expect(
      createAndMaybeSubmit("token", {
        title: "Spare parts",
        submit: true,
        destinationCountryCode: "NG",
        destinationAddress: "HQ",
        items: [
          {
            id: "local-1",
            description: "Bearing SKF",
            quantity: 2,
            unit: "pcs",
          },
        ],
        rowVersion: 0,
      }),
    ).rejects.toMatchObject({
      status: 422,
      message: expect.stringMatching(/destination/i),
    });
  });

  it("filters invalid attachment values before FormData serialization", () => {
    const file = new File(["payload"], "one.txt", { type: "text/plain" });
    const cleaned = sanitizeUploadFiles([
      file,
      // @ts-expect-error invalid runtime value used to simulate broken input
      "blob:http://127.0.0.1:3000/preview",
      undefined,
    ]);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0]?.name).toBe("one.txt");
  });

  it("accepts a single valid file for upload serialization", () => {
    const file = new File(["payload"], "single.txt", { type: "text/plain" });
    const valid = sanitizeUploadFiles([file]);
    expect(valid).toHaveLength(1);
    expect(valid[0]?.name).toBe("single.txt");
  });

  it("accepts multiple valid files for upload serialization", () => {
    const files = [
      new File(["a"], "a.txt", { type: "text/plain" }),
      new File(["b"], "b.txt", { type: "text/plain" }),
    ];
    const valid = sanitizeUploadFiles(files);
    expect(valid).toHaveLength(2);
    expect(valid.map((file) => file.name)).toEqual(["a.txt", "b.txt"]);
  });

  it("normalizes FileList-like input and strips blob URLs before upload", () => {
    const file = new File(["payload"], "from-filelist.txt", {
      type: "text/plain",
    });
    const fileListLike = {
      0: file,
      1: "blob:http://127.0.0.1:3000/preview",
      length: 2,
      item: (index: number) => (index === 0 ? file : null),
    } as unknown as FileList;

    const normalized = sanitizeUploadFiles(fileListLike as unknown as unknown[]);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.name).toBe("from-filelist.txt");
  });
});
