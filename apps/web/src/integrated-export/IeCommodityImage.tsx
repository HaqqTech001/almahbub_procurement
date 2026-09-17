import { PresentationImage } from "../components/PresentationImage.js";
import { canonicalIeMedia, presentationSource } from "../content/presentation-media.js";

type IeCommodityImageProps = {
  src: string;
  slug?: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  /** Marks the hero <img> for catalogue/detail verification. */
  hero?: boolean;
  decorative?: boolean;
};

/**
 * Canonical covers/gallery roles use curated artwork; unmapped runtime media is retained.
 */
export function IeCommodityImage({
  src,
  slug,
  alt,
  className,
  loading = "lazy",
  hero = false,
  decorative = false,
}: IeCommodityImageProps) {
  const fallback = canonicalIeMedia(src, slug);
  return <PresentationImage src={presentationSource(src, fallback)} fallbackSrc={fallback} alt={alt} className={className} loading={loading} hero={hero} decorative={decorative} />;
}
