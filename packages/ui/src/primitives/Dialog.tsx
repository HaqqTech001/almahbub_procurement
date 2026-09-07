import { useEffect, useId, useRef, type ReactNode } from "react";
import { cx } from "../utils/cx.js";
import { Button } from "./Button.js";
import { IconButton } from "./IconButton.js";

export type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string | undefined;
  onClose: () => void;
};

export function Dialog({
  open,
  title,
  description,
  children,
  footer,
  className,
  onClose,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="hamd-dialog__overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cx("hamd-dialog", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className="hamd-dialog__header">
          <div>
            <h2 id={titleId} className="hamd-dialog__title">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="hamd-dialog__description">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton ref={closeRef} label="Close" className="hamd-dialog__close" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </IconButton>
        </div>
        {children ? <div className="hamd-dialog__body">{children}</div> : null}
        {footer ? <div className="hamd-dialog__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  busyLabel?: string;
  tone?: "danger" | "default";
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmationDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  busyLabel = "Working…",
  tone = "default",
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      title={title}
      onClose={onCancel}
      className={tone === "danger" ? "hamd-dialog--danger" : undefined}
      footer={
        <>
          <Button variant="ghost" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "destructive" : "primary"}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? busyLabel : confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
