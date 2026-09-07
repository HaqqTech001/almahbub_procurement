import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { cx } from "../utils/cx.js";

export type OptimizedImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "loading" | "decoding"
> & {
  /** Priority images (hero LCP) skip lazy loading and elevate fetch priority. */
  priority?: boolean;
  className?: string | undefined;
  /** Optional elegant fallback when the image fails to load. */
  fallbackSrc?: string | undefined;
  onLoadError?: (() => void) | undefined;
};

/**
 * Performance-minded image wrapper - lazy by default, async decode,
 * explicit sizes, optional priority. Prefer width/height (or CSS aspect-ratio)
 * to prevent CLS. Never leaves a broken image icon.
 */
export function OptimizedImage({
  priority = false,
  className,
  alt = "",
  sizes,
  width,
  height,
  style,
  src,
  fallbackSrc,
  onLoadError,
  onError,
  ...rest
}: OptimizedImageProps) {
  const [failed, setFailed] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
    setFailed(false);
  }, [src]);

  const aspectStyle =
    width != null &&
    height != null &&
    Number(width) > 0 &&
    Number(height) > 0 &&
    !style?.aspectRatio
      ? {
          aspectRatio: `${Number(width)} / ${Number(height)}`,
          ...style,
        }
      : style;

  if (!currentSrc || failed) {
    return (
      <span
        className={cx("hamd-img hamd-img--placeholder", className)}
        role="img"
        aria-label={alt || "Image unavailable"}
        style={aspectStyle}
      />
    );
  }

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      style={aspectStyle}
      className={cx("hamd-img", priority && "hamd-img--priority", className)}
      sizes={sizes ?? (priority ? "100vw" : "(max-width: 768px) 100vw, 33vw")}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      {...({ fetchpriority: priority ? "high" : "auto" } as Record<string, string>)}
      onError={(event) => {
        onError?.(event);
        onLoadError?.();
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
