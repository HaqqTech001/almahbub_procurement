import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type AppPageFrameProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Shared application content gutters for buyer and Ops pages.
 * Shells already pad; this keeps nested hosts from colliding with edges.
 */
export function AppPageFrame({ children, className }: AppPageFrameProps) {
  return <div className={cx("hamd-app-page-frame", className)}>{children}</div>;
}
