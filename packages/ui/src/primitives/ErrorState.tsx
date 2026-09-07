import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";
import { Button } from "./Button.js";
import { ButtonLink } from "./ButtonLink.js";

export type ErrorStateProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  children?: ReactNode;
};

export function ErrorState({
  title,
  description,
  actionHref,
  actionLabel,
  onRetry,
  retryLabel = "Try again",
  className,
  children,
}: ErrorStateProps) {
  return (
    <div className={cx("hamd-error-state", className)} role="alert">
      <h2 className="hamd-error-state__title">{title}</h2>
      {description ? (
        <p className="hamd-error-state__description">{description}</p>
      ) : null}
      {children}
      {actionHref && actionLabel ? (
        <div className="hamd-error-state__actions">
          <ButtonLink href={actionHref} variant="primary">
            {actionLabel}
          </ButtonLink>
        </div>
      ) : null}
      {onRetry ? (
        <div className="hamd-error-state__actions">
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
