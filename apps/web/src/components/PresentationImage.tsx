import { useState, type CSSProperties } from "react";
import { resolveMediaUrl } from "../lib/media-url.js";
import "../styles/presentation-image.css";

type Props = {
  src?: string | undefined;
  fallbackSrc?: string | undefined;
  alt: string;
  className?: string | undefined;
  loading?: "lazy" | "eager";
  hero?: boolean;
  decorative?: boolean;
  style?: CSSProperties;
};

export function PresentationImage({ src, fallbackSrc, alt, className = "", loading = "lazy", hero, decorative, style }: Props) {
  const candidates = [...new Set([resolveMediaUrl(src), resolveMediaUrl(fallbackSrc)].filter((value): value is string => Boolean(value)))];
  // Keyed child resets failure state when an administrator changes the source.
  return <ImageAttempt key={candidates.join("|")} candidates={candidates} alt={alt} className={className} loading={loading} hero={hero} decorative={decorative} style={style} />;
}

function ImageAttempt({ candidates, alt, className, loading, hero, decorative, style }: Omit<Props, "src" | "fallbackSrc"> & { candidates: string[] }) {
  const [index, setIndex] = useState(0);
  const current = candidates[index];
  if (!current) return <div className={`presentation-image presentation-image--placeholder ${className}`} style={style} role={decorative ? undefined : "img"} aria-label={decorative ? undefined : `${alt}: image unavailable`} aria-hidden={decorative || undefined}><span aria-hidden="true">Image unavailable</span></div>;
  return <img className={`presentation-image ${className}`} style={style} src={current} alt={decorative ? "" : alt} loading={loading} decoding="async" data-ie-hero={hero || undefined} onError={() => setIndex(value => value + 1)} />;
}
