import type { CatalogAvailability, CatalogProduct } from "../catalog/types.js";

export type ProductGalleryImage = {
  id: string;
  src: string;
  alt: string;
  thumbSrc?: string | undefined;
};

export type ProductSpecRow = {
  id: string;
  group: string;
  label: string;
  value: string;
  unit?: string | undefined;
};

export type ProductDownload = {
  id: string;
  title: string;
  href: string;
  mimeType?: string | undefined;
  sizeLabel?: string | undefined;
};

export type ProductCertificate = {
  id: string;
  name: string;
  issuer?: string | undefined;
  href?: string | undefined;
  validThrough?: string | undefined;
};

export type ProductBreadcrumb = {
  label: string;
  href?: string | undefined;
};

export type ProductDetailModel = {
  id: string;
  name: string;
  slug: string;
  sku?: string | undefined;
  model?: string | undefined;
  brand?: string | undefined;
  description?: string | undefined;
  categoryName?: string | undefined;
  breadcrumbs: ProductBreadcrumb[];
  manufacturer: string;
  manufacturerHref?: string | undefined;
  supplier?: string | undefined;
  supplierHref?: string | undefined;
  country: string;
  moq: string;
  leadTime: string;
  availability: CatalogAvailability | string;
  requestHref: string;
  catalogHref?: string | undefined;
  images: ProductGalleryImage[];
  specifications: ProductSpecRow[];
  downloads: ProductDownload[];
  certificates: ProductCertificate[];
  related: CatalogProduct[];
  recommended: CatalogProduct[];
  frequentlyBoughtTogether: CatalogProduct[];
};
