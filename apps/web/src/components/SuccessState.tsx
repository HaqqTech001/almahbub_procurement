import type { ReactNode } from "react";
import { ButtonLink } from "@hamd/ui/primitives";
import { cx } from "./cx.js";

export type SuccessStateProps = {
  title: string;
  description?: string | undefined;
  actionHref?: string | undefined;
  actionLabel?: string | undefined;
  className?: string | undefined;
  children?: ReactNode;
};

export function SuccessState({
  title,
  description,
  actionHref,
  actionLabel,
  className,
  children,
}: SuccessStateProps) {
  return (
    <div className={cx("hamd-success-state", className)} role="status">
      <h2 className="hamd-success-state__title">{title}</h2>
      {description ? (
        <p className="hamd-success-state__description">{description}</p>
      ) : null}
      {children}
      {actionHref && actionLabel ? (
        <div className="hamd-success-state__actions">
          <ButtonLink href={actionHref} variant="primary">
            {actionLabel}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
