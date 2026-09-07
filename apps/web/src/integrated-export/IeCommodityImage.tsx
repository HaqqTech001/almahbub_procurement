import { useState } from "react";

import { resolveIeMediaSrc } from "./commodities/ie-commodity-api.js";
import { IeCommodityMediaPlaceholder } from "./IeCommodityMediaPlaceholder.js";

type IeCommodityImageProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  /** Marks the hero <img> for catalogue/detail verification. */
  hero?: boolean;
  decorative?: boolean;
};

/**
 * Renders assigned commodity media. Placeholder only when src is missing or the file fails to load.
 * Never substitutes a different stock photograph.
 */
export function IeCommodityImage({
  src,
  alt,
  className,
  loading = "lazy",
  hero = false,
  decorative = false,
}: IeCommodityImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveIeMediaSrc(src);

  if (!resolved || failed) {
    return (
      <IeCommodityMediaPlaceholder
        className={className}
        decorative={decorative}
      />
    );
  }

  return (
    <img
      className={className}
      src={resolved}
      alt={decorative ? "" : alt}
      loading={loading}
      decoding="async"
      data-ie-hero={hero ? "true" : undefined}
      onError={() => setFailed(true)}
    />
  );
}
