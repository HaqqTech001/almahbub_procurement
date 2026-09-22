import { useState } from "react";
import { Link } from "react-router-dom";
import { OptimizedImage } from "@hamd/ui/primitives";

import {
  availabilityLabel,
  entryTypeLabel,
  type CatalogCardModel,
} from "../lib/catalog-display.js";

export function PublicProductCard({
  product,
  eager,
}: {
  product: CatalogCardModel;
  eager?: boolean;
}) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const imageSrc = (product.imageSources ?? [product.imageSrc]).find(src => src && !failedSources.includes(src));
  const showImage = Boolean(imageSrc);

  // Verified manifest-owned products may intentionally render without photography
  // while exact/licensed media is still pending. Never invent or substitute a photo.

  return (
    <article className="hamd-disc-card hamd-disc-card--grid">
      <Link className="hamd-disc-card__hit" to={product.href} aria-label={product.name}>
        <span className="hamd-disc-card__media">
          {showImage ? (
            <OptimizedImage
              key={imageSrc}
              src={imageSrc}
              alt=""
              width={480}
              height={360}
              sizes="(max-width: 640px) 50vw, (max-width: 1200px) 25vw, 220px"
              priority={eager}
              onLoadError={() => { if (imageSrc) setFailedSources(previous => [...previous, imageSrc]); }}
            />
          ) : (
            <span className="hamd-disc-card__ph" aria-hidden="true">
              <span className="hamd-disc-card__ph-mark">{product.name}</span>
              <span className="hamd-disc-card__ph-note">Image coming soon</span>
            </span>
          )}
          {product.imageIsCategoryFallback ? (
            <span className="hamd-disc-card__tag">Representative category image</span>
          ) : product.categoryName ? (
            <span className="hamd-disc-card__tag">{product.categoryName}</span>
          ) : null}
        </span>
        <span className="hamd-disc-card__body">
          <h3 className="hamd-disc-card__title">{product.name}</h3>
          {entryTypeLabel(product.entryType) ? (
            <span className="hamd-disc-card__meta">{entryTypeLabel(product.entryType)}</span>
          ) : null}
          <span className="hamd-disc-card__meta">
            {availabilityLabel(product.availabilityStatus)}
          </span>
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
