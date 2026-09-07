import { z } from "zod";

export const assistantModeSchema = z.enum(["explain", "assist", "recommend"]);

export const productAdviseSchema = z.object({
  mode: assistantModeSchema.default("recommend"),
  focus: z
    .enum(["alternatives", "explain", "specifications", "all"])
    .default("all"),
  question: z.string().trim().max(2_000).optional(),
  /** Public catalog snapshot when product is not yet in Prisma. */
  product: z
    .object({
      slug: z.string().trim().min(1).max(200),
      name: z.string().trim().min(1).max(300),
      summary: z.string().trim().max(4_000).optional(),
      category: z.string().trim().max(200).optional(),
      manufacturer: z.string().trim().max(300).optional(),
      country: z.string().trim().max(200).optional(),
      moq: z.string().trim().max(200).optional(),
      leadTime: z.string().trim().max(200).optional(),
      availability: z.string().trim().max(200).optional(),
      specifications: z.record(z.unknown()).optional(),
    })
    .optional(),
  productId: z.string().uuid().optional(),
  productSlug: z.string().trim().min(1).max(200).optional(),
}).refine(
  (value) => Boolean(value.product || value.productId || value.productSlug),
  { message: "Provide product, productId, or productSlug." },
);

export const requestGuidanceSchema = z.object({
  mode: assistantModeSchema.default("assist"),
  focus: z
    .enum([
      "missing_information",
      "suppliers",
      "quantities",
      "descriptions",
      "all",
    ])
    .default("all"),
  question: z.string().trim().max(2_000).optional(),
});

export const requestDraftGuidanceSchema = z.object({
  mode: assistantModeSchema.default("assist"),
  focus: z
    .enum([
      "missing_information",
      "suppliers",
      "quantities",
      "descriptions",
      "all",
    ])
    .default("all"),
  question: z.string().trim().max(2_000).optional(),
  draft: z.object({
    title: z.string().trim().max(300).optional(),
    description: z.string().trim().max(10_000).optional(),
    currencyCode: z.string().trim().max(3).optional(),
    destinationCountry: z.string().trim().max(120).optional(),
    destinationCity: z.string().trim().max(120).optional(),
    budgetAmount: z.union([z.string(), z.number()]).optional(),
    priority: z.string().trim().max(40).optional(),
    items: z
      .array(
        z.object({
          description: z.string().trim().max(2_000).optional(),
          quantity: z.union([z.string(), z.number()]).optional(),
          unit: z.string().trim().max(40).optional(),
        }),
      )
      .max(50)
      .optional(),
  }),
});

export const quotationExplainSchema = z.object({
  mode: assistantModeSchema.default("explain"),
  question: z.string().trim().max(2_000).optional(),
});

export const quotationCompareSchema = z.object({
  quotationIds: z.array(z.string().uuid()).min(2).max(6),
  focus: z
    .enum(["price", "lead_time", "commercial_terms", "overall"])
    .default("overall"),
  question: z.string().trim().max(2_000).optional(),
});

export const orderAdviseSchema = z
  .object({
    mode: assistantModeSchema.default("assist"),
    focus: z
      .enum(["delays", "delivery", "actions", "all"])
      .default("all"),
    question: z.string().trim().max(2_000).optional(),
    purchaseOrderId: z.string().uuid().optional(),
    shipmentId: z.string().uuid().optional(),
  })
  .refine(
    (value) => Boolean(value.purchaseOrderId || value.shipmentId),
    { message: "Provide purchaseOrderId and/or shipmentId." },
  );

export const recordIdSchema = z.object({
  id: z.string().uuid(),
});

export type ProductAdviseInput = z.infer<typeof productAdviseSchema>;
export type RequestGuidanceInput = z.infer<typeof requestGuidanceSchema>;
export type RequestDraftGuidanceInput = z.infer<
  typeof requestDraftGuidanceSchema
>;
export type QuotationExplainInput = z.infer<typeof quotationExplainSchema>;
export type QuotationCompareInput = z.infer<typeof quotationCompareSchema>;
export type OrderAdviseInput = z.infer<typeof orderAdviseSchema>;
