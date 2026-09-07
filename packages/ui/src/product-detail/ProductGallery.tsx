import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cx } from "../utils/cx.js";
import { usePrefersReducedMotion } from "../auth/usePrefersReducedMotion.js";
import type { ProductGalleryImage } from "./types.js";

export type ProductGalleryProps = {
  images: ProductGalleryImage[];
  productName: string;
  className?: string | undefined;
};

/**
 * Procurement gallery - hover zoom, click preview, keyboard thumbs.
 * Reduced motion disables zoom motion; preview remains available.
 */
export function ProductGallery({
  images,
  productName,
  className,
}: ProductGalleryProps) {
  const labelId = useId();
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });
  const stageRef = useRef<HTMLDivElement>(null);

  const safeImages =
    images.length > 0
      ? images
      : [
          {
            id: "placeholder",
            src: "",
            alt: `${productName} - image not provided`,
          },
        ];

  const current = safeImages[Math.min(index, safeImages.length - 1)]!;

  const go = useCallback(
    (next: number) => {
      const len = safeImages.length;
      setIndex(((next % len) + len) % len);
    },
    [safeImages.length],
  );

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
      if (event.key === "ArrowRight") go(index + 1);
      if (event.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen, go, index]);

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduced || !current.src) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    setZoom({ active: true, x, y });
  };

  const onThumbKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    i: number,
  ) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      go(i + 1);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      go(i - 1);
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIndex(i);
    }
  };

  return (
    <div className={cx("hamd-pd-gallery", className)}>
      <p id={labelId} className="hamd-sr-only">
        Product images for {productName}
      </p>
      <div
        ref={stageRef}
        className={cx(
          "hamd-pd-gallery__stage",
          zoom.active && !reduced && "is-zooming",
        )}
        role="img"
        aria-labelledby={labelId}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setZoom((z) => ({ ...z, active: false }))}
        onClick={() => {
          if (current.src) setPreviewOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (current.src) setPreviewOpen(true);
          }
        }}
        tabIndex={0}
        aria-describedby={`${labelId}-hint`}
      >
        <p id={`${labelId}-hint`} className="hamd-sr-only">
          {reduced
            ? "Press Enter to open image preview."
            : "Hover to zoom. Press Enter or click to open image preview."}
        </p>
        {current.src ? (
          <img
            src={current.src}
            alt={current.alt}
            className="hamd-pd-gallery__image"
            style={
              zoom.active && !reduced
                ? {
                    transformOrigin: `${zoom.x}% ${zoom.y}%`,
                    transform: "scale(1.85)",
                  }
                : undefined
            }
            decoding="async"
          />
        ) : (
          <div className="hamd-pd-gallery__empty" role="status">
            Image not provided
          </div>
        )}
        {current.src ? (
          <span className="hamd-pd-gallery__hint" aria-hidden="true">
            {reduced ? "Preview" : "Hover to zoom · Click to preview"}
          </span>
        ) : null}
      </div>

      {safeImages.length > 1 ? (
        <ul className="hamd-pd-gallery__thumbs" role="list" aria-label="Image thumbnails">
          {safeImages.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                className={cx(
                  "hamd-pd-gallery__thumb",
                  i === index && "is-active",
                )}
                aria-label={`Show image ${i + 1}: ${img.alt}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
                onKeyDown={(event) => onThumbKeyDown(event, i)}
              >
                {img.src || img.thumbSrc ? (
                  <img
                    src={img.thumbSrc ?? img.src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="hamd-pd-gallery__thumb-ph" />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {previewOpen && current.src ? (
        <div
          className="hamd-pd-preview"
          role="dialog"
          aria-modal="true"
          aria-label={`Image preview: ${current.alt}`}
        >
          <button
            type="button"
            className="hamd-pd-preview__backdrop"
            aria-label="Close image preview"
            onClick={() => setPreviewOpen(false)}
          />
          <div className="hamd-pd-preview__panel">
            <img src={current.src} alt={current.alt} />
            <div className="hamd-pd-preview__controls">
              <button
                type="button"
                className="hamd-pd-btn"
                onClick={() => go(index - 1)}
                disabled={safeImages.length < 2}
              >
                Previous
              </button>
              <button
                type="button"
                className="hamd-pd-btn hamd-pd-btn--primary"
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="hamd-pd-btn"
                onClick={() => go(index + 1)}
                disabled={safeImages.length < 2}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
