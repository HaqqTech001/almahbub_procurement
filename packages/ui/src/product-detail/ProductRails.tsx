import { lazy, Suspense } from "react";
import { ProductCard, ProductCardSkeleton } from "../catalog/ProductCard.js";
import type { CatalogProduct } from "../catalog/types.js";
import { cx } from "../utils/cx.js";

const LazyProductCard = lazy(async () => {
  const mod = await import("../catalog/ProductCard.js");
  return { default: mod.ProductCard };
});

export type ProductRailProps = {
  id: string;
  title: string;
  description?: string | undefined;
  products: CatalogProduct[];
  onQuickQuote?: ((product: CatalogProduct) => void) | undefined;
  className?: string | undefined;
};

function RailBody({
  products,
  onQuickQuote,
}: {
  products: CatalogProduct[];
  onQuickQuote?: ((product: CatalogProduct) => void) | undefined;
}) {
  if (products.length === 0) {
    return (
      <p className="hamd-pd-empty" role="status">
        No products to show.
      </p>
    );
  }

  return (
    <ul className="hamd-pd-rail__grid">
      {products.map((product) => (
        <li key={product.id}>
          <Suspense fallback={<ProductCardSkeleton view="compact" />}>
            <LazyProductCard
              product={product}
              view="compact"
              onQuickQuote={onQuickQuote}
            />
          </Suspense>
        </li>
      ))}
    </ul>
  );
}

export function ProductRail({
  id,
  title,
  description,
  products,
  onQuickQuote,
  className,
}: ProductRailProps) {
  return (
    <section
      id={id}
      className={cx("hamd-pd-rail", className)}
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className="hamd-pd-section__title">
        {title}
      </h2>
      {description ? <p className="hamd-pd-rail__desc">{description}</p> : null}
      <RailBody products={products} onQuickQuote={onQuickQuote} />
    </section>
  );
}

/** Eager compact cards when host prefers no suspense boundary. */
export function ProductRailEager({
  id,
  title,
  description,
  products,
  onQuickQuote,
  className,
}: ProductRailProps) {
  return (
    <section
      id={id}
      className={cx("hamd-pd-rail", className)}
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className="hamd-pd-section__title">
        {title}
      </h2>
      {description ? <p className="hamd-pd-rail__desc">{description}</p> : null}
      {products.length === 0 ? (
        <p className="hamd-pd-empty" role="status">
          No products to show.
        </p>
      ) : (
        <ul className="hamd-pd-rail__grid">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                view="compact"
                onQuickQuote={onQuickQuote}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
