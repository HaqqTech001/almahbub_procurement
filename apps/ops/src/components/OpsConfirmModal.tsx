import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Polished in-app confirmation modal. Replaces native browser confirm dialogs
 * everywhere in the ops workspace. Renders a labelled dialog on an overlay with a close
 * button, Escape support, and focus returning to the trigger on close.
 */
export type OpsConfirmModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "default";
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

let syntheticCounter = 0;

export function OpsConfirmModal({
  open,
  title,
  children,
  confirmLabel,
  tone = "default",
  busy = false,
  onCancel,
  onConfirm,
}: OpsConfirmModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const synthetic = useRef(`ops-confirm-${++syntheticCounter}`);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="hamd-ops-modal__overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="hamd-ops-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="hamd-ops-modal__header">
          <h2 id={titleId} className="hamd-ops-modal__title">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="hamd-ops-modal__close"
            aria-label="Close"
            onClick={onCancel}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="hamd-ops-modal__body">{children}</div>
        <div className="hamd-ops-modal__footer">
          <button
            type="button"
            className="hamd-btn hamd-btn--ghost"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={
              tone === "danger"
                ? "hamd-btn hamd-btn--danger"
                : "hamd-btn hamd-btn--primary"
            }
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
      <span aria-hidden="true" style={{ display: "none" }} data-synthetic={synthetic.current} />
    </div>
  );
}