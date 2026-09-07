import { z } from "zod";

import { IE_COMMODITY_SLUG_PATTERN } from "../domain/ie-commodity.js";

export const IE_COMMODITY_PAGE_SIZE_DEFAULT = 24;
export const IE_COMMODITY_PAGE_SIZE_MAX = 100;
export const IE_COMMODITY_SEARCH_MAX = 200;

export const IE_COMMODITY_SORTS = ["sortOrder", "name", "newest"] as const;

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(IE_COMMODITY_SLUG_PATTERN, {
    message: "Slug must be a lowercase kebab-case identifier.",
  });

/** Media path/alt reference — local /media assets preferred; no binary storage. */
export const ieCommodityMediaSchema = z.object({
  src: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .refine(
      (value) =>
        value.startsWith("/media/") ||
        /^https?:\/\//i.test(value) ||
        /^\/api\/v1\/public\//i.test(value),
      {
        message:
          "Media src must be a /media path, public API media path, or http(s) URL.",
      },
    ),
  alt: z.string().trim().min(1).max(500),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

export const ieCommoditySpecSchema = z.object({
  label: z.string().trim().min(1).max(200),
  value: z.string().trim().min(1).max(2000),
});

export const ieCommodityListQuerySchema = z.object({
  category: z.string().trim().min(1).max(200).optional(),
  q: z.string().trim().min(1).max(IE_COMMODITY_SEARCH_MAX).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(IE_COMMODITY_PAGE_SIZE_MAX)
    .default(IE_COMMODITY_PAGE_SIZE_DEFAULT),
  sort: z.enum(IE_COMMODITY_SORTS).default("sortOrder"),
  /** Ops-only: when true and caller has ops:access, include unpublished drafts. */
  includeUnpublished: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const ieCommoditySlugParamsSchema = z.object({
  slug: slugSchema,
});

export const ieCommodityIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const commodityContentFields = {
  category: z.string().trim().min(1).max(200).nullable().optional(),
  shortDescription: z.string().trim().min(1).max(2000).nullable().optional(),
  description: z.string().trim().min(1).max(20_000).nullable().optional(),
  heroMedia: ieCommodityMediaSchema.nullable().optional(),
  gallery: z.array(ieCommodityMediaSchema).max(50).nullable().optional(),
  specifications: z.array(ieCommoditySpecSchema).max(100).nullable().optional(),
  packaging: z.string().trim().min(1).max(8000).nullable().optional(),
  qualityInformation: z.string().trim().min(1).max(8000).nullable().optional(),
  applications: z
    .array(z.string().trim().min(1).max(500))
    .max(50)
    .nullable()
    .optional(),
  markets: z.string().trim().min(1).max(8000).nullable().optional(),
  sortOrder: z.number().int().min(0).max(1_000_000).optional(),
};

export const createIeCommoditySchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: slugSchema,
  /** Defaults to false (draft) when omitted. */
  published: z.boolean().optional(),
  ...commodityContentFields,
});

export const updateIeCommoditySchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    slug: slugSchema.optional(),
    published: z.boolean().optional(),
    ...commodityContentFields,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one commodity field is required.",
  });

export type IeCommodityListQuery = z.infer<typeof ieCommodityListQuerySchema>;
export type CreateIeCommodityInput = z.infer<typeof createIeCommoditySchema>;
export type UpdateIeCommodityInput = z.infer<typeof updateIeCommoditySchema>;
