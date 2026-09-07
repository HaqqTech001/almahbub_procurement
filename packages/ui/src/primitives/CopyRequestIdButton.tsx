import { useState } from "react";

import { copyTextToClipboard } from "../utils/clipboard.js";
import { cx } from "../utils/cx.js";

export type CopyRequestIdButtonProps = {
  value: string;
  className?: string | undefined;
  onCopied?: ((value: string) => void) | undefined;
  onFailed?: (() => void) | undefined;
};

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <rect
        x="7"
        y="7"
        width="9"
        height="10"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4 13V4.5A1.5 1.5 0 0 1 5.5 3H13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CopyRequestIdButton({
  value,
  className,
  onCopied,
  onFailed,
}: CopyRequestIdButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const label = status === "copied" ? "Request ID copied." : "Copy request ID";

  return (
    <button
      type="button"
      className={cx("hamd-copy-id", className)}
      title={label}
      aria-label={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void copyTextToClipboard(value).then((ok) => {
          if (ok) {
            setStatus("copied");
            onCopied?.(value);
            window.setTimeout(() => setStatus("idle"), 2000);
            return;
          }
          setStatus("failed");
          onFailed?.();
          window.setTimeout(() => setStatus("idle"), 2500);
        });
      }}
    >
      <CopyIcon />
      <span className="hamd-sr-only" aria-live="polite">
        {status === "copied"
          ? "Request ID copied."
          : status === "failed"
            ? "We couldn't copy the request ID."
            : ""}
      </span>
    </button>
  );
}
