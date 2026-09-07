export type * from "./types.js";
export { ProductGallery } from "./ProductGallery.js";
export type { ProductGalleryProps } from "./ProductGallery.js";
export {
  ProductCertificates,
  ProductDownloads,
  ProductProcurementCta,
  ProductSourcingFacts,
  ProductSpecifications,
} from "./ProductSections.js";
export { ProductRail, ProductRailEager } from "./ProductRails.js";
export type { ProductRailProps } from "./ProductRails.js";
export {
  ProductDetailPage,
  ProductDetailSkeleton,
} from "./ProductDetailPage.js";
export type { ProductDetailPageProps } from "./ProductDetailPage.js";
export { productDetailFixture } from "./fixtures.js";

export const productDetailLazy = {
  ProductDetailPage: () => import("./ProductDetailPage.js"),
  ProductGallery: () => import("./ProductGallery.js"),
} as const;
