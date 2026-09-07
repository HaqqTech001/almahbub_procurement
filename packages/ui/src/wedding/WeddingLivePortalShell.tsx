import type { ReactNode } from "react";

import { cx } from "../utils/cx.js";

export type WeddingLivePortalShellProps = {
  children: ReactNode;
  className?: string;
};

/** Full-viewport wedding live shell. No public website chrome. */
export function WeddingLivePortalShell({ children, className }: WeddingLivePortalShellProps) {
  return (
    <div className={cx("hamd-wedding-portal", className)} data-testid="wedding-live-portal">
      {children}
    </div>
  );
}
