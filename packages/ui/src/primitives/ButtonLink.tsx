import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  className?: string;
  ariaLabel?: string;
  /** Optional guide/tour target hook. */
  "data-guide"?: string;
  "data-testid"?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  ariaLabel,
  "data-guide": dataGuide,
  "data-testid": dataTestId,
}: ButtonLinkProps) {
  return (
    <a
      href={href}
      className={cx("hamd-btn", `hamd-btn--${variant}`, className)}
      aria-label={ariaLabel}
      {...(dataGuide ? { "data-guide": dataGuide } : {})}
      {...(dataTestId ? { "data-testid": dataTestId } : {})}
    >
      {children}
    </a>
  );
}
