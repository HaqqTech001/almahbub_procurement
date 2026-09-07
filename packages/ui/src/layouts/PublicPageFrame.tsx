import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";
import { SkipLink } from "../primitives/SkipLink.js";

export type PublicPageFrameProps = {
  children: ReactNode;
  banner?: ReactNode;
  skipLinkHref?: string;
  className?: string;
  showSkipLink?: boolean;
};

/**
 * Outermost public-page chrome: skip link, optional campaign banner, then page.
 * Use above `PublicWebsiteShell` / `Homepage` so banners sit outside main chrome.
 */
export function PublicPageFrame({
  children,
  banner,
  skipLinkHref = "#main-content",
  className,
  showSkipLink = true,
}: PublicPageFrameProps) {
  return (
    <div className={cx("hamd-public-frame", className)}>
      {showSkipLink ? <SkipLink href={skipLinkHref} /> : null}
      {banner}
      {children}
    </div>
  );
}
