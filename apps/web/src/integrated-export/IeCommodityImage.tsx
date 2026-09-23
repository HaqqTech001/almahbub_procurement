import { PresentationImage } from "../components/PresentationImage.js";
import { IE_PRESENTATION_MEDIA } from "../content/presentation-media.js";


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
 * Render the assigned commodity media; never substitute artwork by slug.
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

  return <PresentationImage src={src} fallbackSrc={slug ? IE_PRESENTATION_MEDIA[slug] : undefined} alt={alt} className={className} loading={loading} hero={hero} decorative={decorative} />;
}
