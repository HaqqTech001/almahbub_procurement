import type { AnchorHTMLAttributes } from "react";
import { cx } from "../utils/cx.js";

export const DEFAULT_POWERED_BY_LABEL = "Powered by HaqqTech";

export type PoweredByAttributionProps = {
  label?: string | undefined;
  href?: string | undefined;
  className?: string | undefined;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">;

/**
 * Quiet partner attribution for **allowed surfaces only**:
 * public website footer · client footer/About · ops footer/System Information ·
 * optional email footer. Never use in heroes, headers, dashboards, forms,
 * cards, modals, loading screens, or auth chrome.
 */
export function PoweredByAttribution({
  label = DEFAULT_POWERED_BY_LABEL,
  href,
  className,
  ...rest
}: PoweredByAttributionProps) {
  const classes = cx("hamd-powered-by", className);

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {label}
      </a>
    );
  }

  return <p className={classes}>{label}</p>;
}
