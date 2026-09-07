import { z } from "zod";

export const opsListQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.string().trim().max(64).optional(),
  userStatus: z
    .enum([
      "pending_verification",
      "active",
      "suspended",
      "deactivated",
    ])
    .optional(),
  categoryId: z.string().uuid().optional(),
  sort: z.string().trim().max(64).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  organizationId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export const opsUserIdSchema = z.object({
  userId: z.string().uuid(),
});

export const opsUserAccountStatusSchema = z.object({
  command: z.enum(["suspend", "activate", "deactivate"]),
  reason: z.string().trim().max(500).optional(),
});

export const opsUserOpsAccessSchema = z.object({
  command: z.enum(["grant", "revoke"]),
});

export const opsReportSchema = z.object({
  domain: z.enum([
    "requests",
    "quotations",
    "purchase-orders",
    "invoices",
    "payments",
    "shipments",
    "audit",
    "users",
    "suppliers",
    "products",
  ]),
  format: z.enum(["csv", "excel", "pdf", "json"]).default("csv"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const kebabSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i);

const httpUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .url()
  .refine((value) => /^https?:\/\//i.test(value), {
    message: "URL must use http or https.",
  });

const catalogMediaPathSchema = z
  .string()
  .trim()
  .regex(
    /^\/api\/v1\/public\/catalog-media\/[0-9a-f-]{36}\/[a-zA-Z0-9._-]+$/i,
    "Catalog media path is invalid.",
  );

const productImageUrlSchema = z.union([httpUrlSchema, catalogMediaPathSchema]);

export const createOpsProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: kebabSlugSchema.optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(8000).nullable().optional(),
  brandId: z.string().uuid().nullable().optional(),
  manufacturerId: z.string().uuid().nullable().optional(),
});

export const updateOpsProductSchema = createOpsProductSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one product field is required.",
  });

export const createOpsCategorySchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i)
    .optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  description: z.string().trim().max(4000).optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export const updateOpsCategorySchema = createOpsCategorySchema
  .partial()
  .extend({
    clearImage: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one category field is required.",
  });

export const opsResourceIdSchema = z.object({
  id: z.string().uuid(),
});

export const opsProductImageParamsSchema = z.object({
  id: z.string().uuid(),
  imageId: z.string().uuid(),
});

export const createOpsProductImageSchema = z.object({
  url: productImageUrlSchema,
  altText: z.string().trim().max(200).nullable().optional(),
  caption: z.string().trim().max(500).nullable().optional(),
  position: z.coerce.number().int().min(0).max(99).optional(),
  storageKey: z.string().trim().max(500).nullable().optional(),
  mimeType: z.string().trim().max(120).nullable().optional(),
  fileSize: z.coerce.number().int().min(1).max(10 * 1024 * 1024).optional(),
});

export const updateOpsProductImageSchema = z
  .object({
    url: productImageUrlSchema.optional(),
    altText: z.string().trim().max(200).nullable().optional(),
    position: z.coerce.number().int().min(0).max(99).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one image field is required.",
  });

export const opsProductVideoParamsSchema = z.object({
  id: z.string().uuid(),
  videoId: z.string().uuid(),
});

export const createOpsProductVideoSchema = z.object({
  url: productImageUrlSchema,
  title: z.string().trim().max(200).nullable().optional(),
  caption: z.string().trim().max(500).nullable().optional(),
  position: z.coerce.number().int().min(0).max(99).optional(),
});

export const updateOpsProductVideoSchema = z
  .object({
    url: productImageUrlSchema.optional(),
    title: z.string().trim().max(200).nullable().optional(),
    caption: z.string().trim().max(500).nullable().optional(),
    position: z.coerce.number().int().min(0).max(99).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one video field is required.",
  });

export const createOpsBrandSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: kebabSlugSchema.optional(),
});

export const createOpsManufacturerSchema = z.object({
  legalName: z.string().trim().min(1).max(200),
  countryCode: z
    .string()
    .trim()
    .length(2)
    .regex(/^[a-zA-Z]{2}$/)
    .transform((value) => value.toUpperCase())
    .nullable()
    .optional(),
});

export type OpsListQuery = z.infer<typeof opsListQuerySchema>;
export type OpsReportInput = z.infer<typeof opsReportSchema>;
export type UserAccountStatusInput = z.infer<typeof opsUserAccountStatusSchema>;
export type UserOpsAccessInput = z.infer<typeof opsUserOpsAccessSchema>;
export type CreateOpsProductInput = z.infer<typeof createOpsProductSchema>;
export type UpdateOpsProductInput = z.infer<typeof updateOpsProductSchema>;
export type CreateOpsCategoryInput = z.infer<typeof createOpsCategorySchema>;
export type UpdateOpsCategoryInput = z.infer<typeof updateOpsCategorySchema>;
export type CreateOpsProductImageInput = z.infer<typeof createOpsProductImageSchema>;
export type UpdateOpsProductImageInput = z.infer<typeof updateOpsProductImageSchema>;
export type CreateOpsProductVideoInput = z.infer<typeof createOpsProductVideoSchema>;
export type UpdateOpsProductVideoInput = z.infer<typeof updateOpsProductVideoSchema>;
export type CreateOpsBrandInput = z.infer<typeof createOpsBrandSchema>;
export type CreateOpsManufacturerInput = z.infer<typeof createOpsManufacturerSchema>;
