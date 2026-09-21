import { PresentationImage } from "../components/PresentationImage.js";


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

  alt,
  className,
  loading = "lazy",
  hero = false,
  decorative = false,
}: IeCommodityImageProps) {

  return <PresentationImage src={src} alt={alt} className={className} loading={loading} hero={hero} decorative={decorative} />;
}
