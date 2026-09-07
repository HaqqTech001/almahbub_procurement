import { cx } from "../utils/cx.js";
import type { CatalogProduct } from "../catalog/types.js";
import { ProductGallery } from "./ProductGallery.js";
import { ProductRailEager } from "./ProductRails.js";
import {
  ProductCertificates,
  ProductDownloads,
  ProductProcurementCta,
  ProductSourcingFacts,
  ProductSpecifications,
} from "./ProductSections.js";
import type { ProductDetailModel } from "./types.js";

export type ProductDetailPageProps = {
  product: ProductDetailModel;
  loading?: boolean | undefined;
  className?: string | undefined;
  bookmarked?: boolean | undefined;
  comparing?: boolean | undefined;
  compareDisabled?: boolean | undefined;
  onBookmark?: (() => void) | undefined;
  onCompare?: (() => void) | undefined;
  onRequest?: (() => void) | undefined;
  onQuickQuote?: ((product: CatalogProduct) => void) | undefined;
};

export function ProductDetailSkeleton({ className }: { className?: string | undefined }) {
  return (
    <div
      className={cx("hamd-pd", "hamd-pd--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-pd-skel hamd-pd-skel--gallery" />
      <div className="hamd-pd-skel hamd-pd-skel--title" />
      <div className="hamd-pd-skel hamd-pd-skel--line" />
      <div className="hamd-pd-skel hamd-pd-skel--cta" />
    </div>
  );
}

/**
 * B2B product detail - evidence first, Request CTA primary (docs/15, docs/51).
 * Gallery supports hover zoom + image preview. No cart language.
 */
export function ProductDetailPage({
  product,
  loading,
  className,
  bookmarked,
  comparing,
  compareDisabled,
  onBookmark,
  onCompare,
  onRequest,
  onQuickQuote,
}: ProductDetailPageProps) {
  if (loading) {
    return <ProductDetailSkeleton className={className} />;
  }

  return (
    <article className={cx("hamd-pd", className)} data-product-id={product.id}>
      <a className="hamd-pd__skip" href="#pd-procurement-cta">
        Skip to procurement request
      </a>

      {product.breadcrumbs.length > 0 ? (
        <nav className="hamd-pd-crumbs" aria-label="Breadcrumb">
          <ol>
            {product.breadcrumbs.map((crumb, i) => (
              <li key={`${crumb.label}-${i}`}>
                {crumb.href ? (
                  <a href={crumb.href}>{crumb.label}</a>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="hamd-pd__hero">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="hamd-pd__summary">
          {product.categoryName ? (
            <p className="hamd-pd__eyebrow">{product.categoryName}</p>
          ) : null}
          <h1 className="hamd-pd__title">{product.name}</h1>
          <p className="hamd-pd__identity">
            {[
              product.brand ? `Brand ${product.brand}` : null,
              product.model ? `Model ${product.model}` : null,
              product.sku ? `SKU ${product.sku}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Identity details not provided"}
          </p>
          {product.description ? (
            <p className="hamd-pd__desc">{product.description}</p>
          ) : null}

          <div id="pd-procurement-cta">
            <ProductProcurementCta
              requestHref={product.requestHref}
              productName={product.name}
              onRequest={onRequest}
              bookmarked={bookmarked}
              comparing={comparing}
              compareDisabled={compareDisabled}
              onBookmark={onBookmark}
              onCompare={onCompare}
            />
          </div>

          <ProductSourcingFacts product={product} />
        </div>
      </div>

      <div className="hamd-pd__body">
        <ProductSpecifications specifications={product.specifications} />
        <div className="hamd-pd__docs">
          <ProductDownloads downloads={product.downloads} />
          <ProductCertificates certificates={product.certificates} />
        </div>

        <ProductRailEager
          id="related-products"
          title="Related products"
          description="Same category family and compatible sourcing paths."
          products={product.related}
          onQuickQuote={onQuickQuote}
        />
        <ProductRailEager
          id="recommended-products"
          title="Recommended products"
          description="Suggested alternates based on specification fit."
          products={product.recommended}
          onQuickQuote={onQuickQuote}
        />
        <ProductRailEager
          id="frequently-bought-together"
          title="Frequently sourced together"
          description="Often requested in the same procurement corridor - not a cart bundle."
          products={product.frequentlyBoughtTogether}
          onQuickQuote={onQuickQuote}
        />
      </div>
    </article>
  );
}
