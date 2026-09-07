import type { CatalogProduct } from "./types.js";
import { COMPARE_LIMIT } from "./types.js";

export type CompareTrayProps = {
  products: CatalogProduct[];
  onRemove: (id: string) => void;
  onClear: () => void;
  compareHref?: string | undefined;
};

/** Pinned compare tray - max 4 products (docs/49). */
export function CompareTray({
  products,
  onRemove,
  onClear,
  compareHref = "/catalog/compare",
}: CompareTrayProps) {
  if (products.length === 0) return null;

  return (
    <aside
      className="hamd-cat-compare"
      aria-label="Compare products"
      data-count={products.length}
    >
      <div className="hamd-cat-compare__head">
        <h2>
          Compare{" "}
          <span>
            {products.length}/{COMPARE_LIMIT}
          </span>
        </h2>
        <button type="button" className="hamd-cat-linkish" onClick={onClear}>
          Clear
        </button>
      </div>
      <ul className="hamd-cat-compare__list">
        {products.map((p) => (
          <li key={p.id}>
            <span className="hamd-cat-compare__name">{p.name}</span>
            <button
              type="button"
              className="hamd-cat-linkish"
              aria-label={`Remove ${p.name} from compare`}
              onClick={() => onRemove(p.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <a
        className="hamd-cat-btn hamd-cat-btn--primary"
        href={compareHref}
        aria-disabled={products.length < 2 ? true : undefined}
        onClick={(e) => {
          if (products.length < 2) e.preventDefault();
        }}
      >
        Open comparison
      </a>
    </aside>
  );
}

export type RelatedRailProps = {
  title: string;
  products: CatalogProduct[];
  onQuickQuote?: ((product: CatalogProduct) => void) | undefined;
};

export function RelatedProductsRail({
  title,
  products,
  onQuickQuote,
}: RelatedRailProps) {
  if (products.length === 0) return null;
  return (
    <section className="hamd-cat-rail" aria-label={title}>
      <h2 className="hamd-cat-aside__title">{title}</h2>
      <ul className="hamd-cat-rail__list">
        {products.map((p) => (
          <li key={p.id}>
            <a href={p.href} className="hamd-cat-rail__link">
              <span className="hamd-cat-rail__name">{p.name}</span>
              <span className="hamd-cat-rail__meta">
                {p.manufacturer} · {p.moq}
              </span>
            </a>
            {onQuickQuote ? (
              <button
                type="button"
                className="hamd-cat-linkish"
                onClick={() => onQuickQuote(p)}
              >
                Quick quote
              </button>
            ) : (
              <a className="hamd-cat-linkish" href={p.requestHref}>
                Quick quote
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
