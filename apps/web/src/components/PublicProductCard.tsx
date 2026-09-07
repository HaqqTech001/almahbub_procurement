import { useState } from "react";
import { Link } from "react-router-dom";
import { OptimizedImage } from "@hamd/ui/primitives";

import type { CatalogCardModel } from "../lib/catalog-display.js";

export function PublicProductCard({
  product,
  eager,
}: {
  product: CatalogCardModel;
  eager?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(product.imageSrc) && !imageFailed;

  return (
    <article className="hamd-disc-card hamd-disc-card--grid">
      <Link className="hamd-disc-card__hit" to={product.href} aria-label={product.name}>
        <span className="hamd-disc-card__media">
          {showImage ? (
            <OptimizedImage
              src={product.imageSrc}
              alt=""
              width={480}
              height={360}
              sizes="(max-width: 640px) 50vw, (max-width: 1200px) 25vw, 220px"
              priority={eager}
              onLoadError={() => setImageFailed(true)}
            />
          ) : (
            <span className="hamd-disc-card__ph" aria-hidden="true">
              <span className="hamd-disc-card__ph-mark">Catalogue placeholder</span>
              <span className="hamd-disc-card__ph-note">Image not available yet</span>
            </span>
          )}
          {product.categoryName ? (
            <span className="hamd-disc-card__tag">{product.categoryName}</span>
          ) : null}
        </span>
        <span className="hamd-disc-card__body">
          <h3 className="hamd-disc-card__title">{product.name}</h3>
          <span className="hamd-sr-only">{product.imageAlt}</span>
        </span>
      </Link>
    </article>
  );
}

export function PublicProductCardSkeleton() {
  return (
    <div className="hamd-disc-card hamd-disc-card--grid hamd-disc-card--skeleton" aria-hidden="true">
      <div className="hamd-disc-card__media hamd-disc-card__media--skel" />
      <div className="hamd-disc-card__body">
        <div className="hamd-disc-skel" />
      </div>
    </div>
  );
}
