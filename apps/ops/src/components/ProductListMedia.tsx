import { useState } from "react";
import { OptimizedImage } from "@hamd/ui/primitives";
import { orderedProductImages } from "@hamd/constants";

export function ProductListMedia({ name, images }: { name: string; images: { url: string; position: number; altText?: string | null }[] }) {
  const [failed, setFailed] = useState<string[]>([]);
  const current = orderedProductImages(images).find(image => !failed.includes(image.url));
  return current ? <OptimizedImage key={current.url} src={current.url} alt={current.altText || name} width={480} height={360}
    onLoadError={() => setFailed(previous => [...previous, current.url])} />
    : <span className="hamd-module-card__media-fallback" role="img" aria-label={`${name}: image unavailable`}>Image coming soon</span>;
}
