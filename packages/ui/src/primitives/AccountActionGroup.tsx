import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type AccountActionGroupProps = {
  children: ReactNode;
  className?: string | undefined;
};

export function AccountActionGroup({ children, className }: AccountActionGroupProps) {
  return <div className={cx("hamd-account-actions", className)}>{children}</div>;
}
