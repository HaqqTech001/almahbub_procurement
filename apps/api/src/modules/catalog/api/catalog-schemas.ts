import { z } from "zod";

import {
  PUBLIC_PAGE_SIZE_DEFAULT,
  PUBLIC_PAGE_SIZE_MAX,
  PUBLIC_PRODUCT_SORTS,
  PUBLIC_SEARCH_MAX_LENGTH,
} from "../application/catalog-policy.js";

export const publicCategorySlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Category must be a lowercase slug.",
  });

export const publicProductIdentifierSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Product identifier must be a lowercase slug.",
    }),
});

export const publicProductListQuerySchema = z.object({
  category: publicCategorySlugSchema.optional(),
  q: z.string().trim().min(1).max(PUBLIC_SEARCH_MAX_LENGTH).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PUBLIC_PAGE_SIZE_MAX)
    .default(PUBLIC_PAGE_SIZE_DEFAULT),
  sort: z.enum(PUBLIC_PRODUCT_SORTS).default("newest"),
});

export const publicCategoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PUBLIC_PAGE_SIZE_MAX)
    .default(PUBLIC_PAGE_SIZE_DEFAULT),
});

export type PublicProductListQuery = z.infer<typeof publicProductListQuerySchema>;
export type PublicCategoryListQuery = z.infer<typeof publicCategoryListQuerySchema>;
