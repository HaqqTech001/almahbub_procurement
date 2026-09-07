import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type SkipLinkProps = {
  href?: string;
  children?: ReactNode;
  className?: string;
};

/** First-focus accessibility control for public and authenticated shells. */
export function SkipLink({
  href = "#main-content",
  children = "Skip to main content",
  className,
}: SkipLinkProps) {
  return (
    <a className={cx("hamd-skip-link", className)} href={href}>
      {children}
    </a>
  );
}
