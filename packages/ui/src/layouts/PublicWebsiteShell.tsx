import type { ReactNode } from "react";
import {
  GlobalFooter,
  GlobalHeader,
  type GlobalFooterProps,
  type GlobalHeaderProps,
} from "../navigation/index.js";
import { cx } from "../utils/cx.js";

export type PublicWebsiteShellProps = {
  children: ReactNode;
  header?: GlobalHeaderProps;
  footer?: GlobalFooterProps;
  className?: string;
  mainId?: string;
};

/** Shared public shell - Header + main landmark + Footer. */
export function PublicWebsiteShell({
  children,
  header,
  footer,
  className,
  mainId = "main-content",
}: PublicWebsiteShellProps) {
  return (
    <div className={cx("hamd-homepage", className)}>
      <GlobalHeader {...header} transparentUntilScroll={header?.transparentUntilScroll ?? true} />
      <main id={mainId} className="hamd-homepage__main">
        {children}
      </main>
      <GlobalFooter {...footer} />
    </div>
  );
}
