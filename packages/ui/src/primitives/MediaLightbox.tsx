import { useEffect } from "react";
import { cx } from "../utils/cx.js";

export type MediaLightboxItem = {
  src: string;
  kind: "image" | "video" | "file";
  alt?: string | undefined;
  caption?: string | undefined;
};

export type MediaLightboxProps = {
  open: boolean;
  items: readonly MediaLightboxItem[];
  index: number;
  onClose: () => void;
  onIndexChange?: ((index: number) => void) | undefined;
  className?: string | undefined;
};

export function MediaLightbox({
  open,
  items,
  index,
  onClose,
  onIndexChange,
  className,
}: MediaLightboxProps) {
  const current = items[index];
  const canNavigate = items.length > 1 && Boolean(onIndexChange);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (!canNavigate || !onIndexChange) return;
      if (event.key === "ArrowLeft") {
        onIndexChange((index - 1 + items.length) % items.length);
      }
      if (event.key === "ArrowRight") {
        onIndexChange((index + 1) % items.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, canNavigate, onIndexChange, index, items.length]);

  if (!open || !current) return null;

  return (
    <div
      className={cx("hamd-media-lightbox", className)}
      role="dialog"
      aria-modal="true"
      aria-label={current.alt || current.caption || "Media preview"}
      data-media-kind={current.kind}
    >
      <button
        type="button"
        className="hamd-media-lightbox__scrim"
        aria-label="Close preview"
        onClick={onClose}
      />
      <figure>
        {current.kind === "video" ? (
          <video src={current.src} controls playsInline preload="metadata" />
        ) : current.kind === "file" ? (
          <iframe title="Document preview" src={current.src} />
        ) : (
          <img src={current.src} alt={current.alt ?? ""} />
        )}
        {current.caption ? <figcaption>{current.caption}</figcaption> : null}
        <div className="hamd-media-lightbox__controls">
          {canNavigate ? (
            <button
              type="button"
              className="hamd-btn hamd-btn--ghost"
              aria-label="Previous media"
              onClick={() =>
                onIndexChange?.((index - 1 + items.length) % items.length)
              }
            >
              Previous
            </button>
          ) : null}
          {canNavigate ? (
            <p className="hamd-media-lightbox__count">
              {index + 1} of {items.length}
            </p>
          ) : null}
          <button type="button" className="hamd-btn hamd-btn--secondary" onClick={onClose}>
            Close
          </button>
          {canNavigate ? (
            <button
              type="button"
              className="hamd-btn hamd-btn--ghost"
              aria-label="Next media"
              onClick={() => onIndexChange?.((index + 1) % items.length)}
            >
              Next
            </button>
          ) : null}
        </div>
      </figure>
    </div>
  );
}
