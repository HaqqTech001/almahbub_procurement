import { useState } from "react";
import { cx } from "../utils/cx.js";
import { OptimizedImage } from "../primitives/OptimizedImage.js";
import { availabilityLabel, type CatalogProduct, type CatalogViewMode } from "./types.js";

export type ProductCardProps = {
  product: CatalogProduct;
  view?: CatalogViewMode | undefined;
  bookmarked?: boolean | undefined;
  comparing?: boolean | undefined;
  compareDisabled?: boolean | undefined;
  onBookmark?: ((id: string) => void) | undefined;
  onCompare?: ((id: string) => void) | undefined;
  onQuickQuote?: ((product: CatalogProduct) => void) | undefined;
  loading?: boolean | undefined;
};

function Field({ label, value }: { label: string; value?: string | undefined }) {
  return (
    <span className="hamd-cat-field">
      <span className="hamd-cat-field__label">{label}</span>
      <span className="hamd-cat-field__value">
        {value?.trim() ? value : "Not provided"}
      </span>
    </span>
  );
}

export function ProductCardSkeleton({ view = "grid" }: { view?: CatalogViewMode }) {
  return (
    <div
      className={cx("hamd-cat-card", `hamd-cat-card--${view}`, "hamd-cat-card--skeleton")}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-cat-skel hamd-cat-skel--image" />
      <div className="hamd-cat-skel hamd-cat-skel--line" />
      <div className="hamd-cat-skel hamd-cat-skel--line hamd-cat-skel--short" />
    </div>
  );
}

/** Procurement product card - Request, not cart. Grid / List / Compact. */
export function ProductCard({
  product,
  view = "grid",
  bookmarked,
  comparing,
  compareDisabled,
  onBookmark,
  onCompare,
  onQuickQuote,
  loading,
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (loading) {
    return <ProductCardSkeleton view={view} />;
  }

  const avail = availabilityLabel(String(product.availability));
  const imageAlt =
    product.imageAlt?.trim() ||
    `${product.name}${product.manufacturer ? ` by ${product.manufacturer}` : ""}`;
  const showImage = Boolean(product.imageSrc) && !imageFailed;

  return (
    <article
      className={cx(
        "hamd-cat-card",
        `hamd-cat-card--${view}`,
        comparing && "is-comparing",
        bookmarked && "is-bookmarked",
      )}
      data-product-id={product.id}
      data-availability={product.availability}
    >
      <a className="hamd-cat-card__media" href={product.href} tabIndex={-1} aria-hidden="true">
        {showImage ? (
          <OptimizedImage
            src={product.imageSrc}
            alt=""
            width={480}
            height={360}
            sizes="(max-width: 768px) 50vw, 280px"
            onLoadError={() => setImageFailed(true)}
          />
        ) : (
          <span className="hamd-cat-card__ph" aria-hidden="true">
            <span className="hamd-cat-card__ph-mark">Almahbub</span>
          </span>
        )}
        {product.categoryName ? (
          <span className="hamd-cat-card__badge hamd-cat-card__badge--category">
            {product.categoryName}
          </span>
        ) : null}
        {product.availability && product.availability !== "unknown" ? (
          <span
            className="hamd-cat-card__badge hamd-cat-card__badge--avail"
            data-status={product.availability}
          >
            {avail}
          </span>
        ) : null}
      </a>

      <div className="hamd-cat-card__body">
        <h3 className="hamd-cat-card__title">
          <a href={product.href}>{product.name}</a>
        </h3>
        <p className="hamd-cat-card__maker">{product.manufacturer}</p>
        {product.description ? (
          <p className="hamd-cat-card__reason">{product.description}</p>
        ) : product.reason ? (
          <p className="hamd-cat-card__reason">{product.reason}</p>
        ) : null}

        {product.country || product.moq || product.leadTime || product.brand ? (
          <div className="hamd-cat-card__meta">
            {view !== "compact" && product.country ? (
              <Field label="Origin" value={product.country} />
            ) : null}
            {product.moq ? <Field label="MOQ" value={product.moq} /> : null}
            {product.leadTime ? <Field label="Lead time" value={product.leadTime} /> : null}
            {view === "list" && product.brand ? (
              <Field label="Brand" value={product.brand} />
            ) : null}
          </div>
        ) : null}

        {product.priceLabel?.trim() ? (
          <div className="hamd-cat-card__price-row">
            <span className="hamd-cat-card__price">{product.priceLabel}</span>
          </div>
        ) : null}

        {view !== "compact" && product.certifications && product.certifications.length > 0 ? (
          <ul className="hamd-cat-certs" aria-label="Certifications">
            {product.certifications.slice(0, 3).map((c) => (
              <li key={c}>{c}</li>
            ))}
            {product.certifications.length > 3 ? (
              <li>+{product.certifications.length - 3}</li>
            ) : null}
          </ul>
        ) : null}

        <span className="hamd-sr-only">{imageAlt}</span>
      </div>

      <div className="hamd-cat-card__actions">
        <a
          className="hamd-cat-btn hamd-cat-btn--primary"
          href={product.requestHref}
          onClick={(event) => {
            if (onQuickQuote) {
              event.preventDefault();
              onQuickQuote(product);
            }
          }}
        >
          Request Procurement
        </a>
        {onBookmark ? (
          <button
            type="button"
            className={cx("hamd-cat-btn", bookmarked && "is-active")}
            aria-pressed={bookmarked}
            aria-label={
              bookmarked
                ? `Remove ${product.name} from bookmarks`
                : `Save ${product.name} to bookmarks`
            }
            onClick={() => onBookmark(product.id)}
          >
            {bookmarked ? "Saved" : "Save"}
          </button>
        ) : null}
        {onCompare ? (
          <button
            type="button"
            className={cx("hamd-cat-btn", comparing && "is-active")}
            aria-pressed={comparing}
            disabled={!comparing && compareDisabled}
            title={
              !comparing && compareDisabled
                ? "Compare limit reached (4 products)"
                : undefined
            }
            aria-label={
              comparing
                ? `Remove ${product.name} from compare`
                : compareDisabled
                  ? `Cannot compare ${product.name}; limit reached`
                  : `Compare ${product.name}`
            }
            onClick={() => onCompare(product.id)}
          >
            Compare
          </button>
        ) : null}
        <a className="hamd-cat-btn hamd-cat-btn--ghost" href={product.href}>
          View Details
        </a>
      </div>
    </article>
  );
}
