import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";
import { ButtonLink } from "./ButtonLink.js";

export type EmptyStateProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  icon,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cx("hamd-empty-state", className)} role="status">
      {icon ? (
        <div className="hamd-empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h2 className="hamd-empty-state__title">{title}</h2>
      {description ? (
        <p className="hamd-empty-state__description">{description}</p>
      ) : null}
      {children}
      {actionHref && actionLabel ? (
        <div className="hamd-empty-state__actions">
          <ButtonLink href={actionHref} variant="primary">
            {actionLabel}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
