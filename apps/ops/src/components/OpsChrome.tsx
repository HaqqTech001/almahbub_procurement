import type { ReactNode } from "react";
import { LoadingSkeleton } from "@hamd/ui/primitives";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export type OpsAlertProps = {
  children: ReactNode;
  tone?: "danger" | "warning" | "info" | undefined;
  className?: string | undefined;
};

export function OpsAlert({
  children,
  tone = "danger",
  className,
}: OpsAlertProps) {
  return (
    <p
      className={cx("hamd-ops-alert", `hamd-ops-alert--${tone}`, className)}
      role="alert"
    >
      {children}
    </p>
  );
}

export type OpsStatusProps = {
  children: ReactNode;
  tone?: "neutral" | "success" | undefined;
  className?: string | undefined;
};

export function OpsStatus({
  children,
  tone = "neutral",
  className,
}: OpsStatusProps) {
  return (
    <p
      className={cx("hamd-ops-status", `hamd-ops-status--${tone}`, className)}
      role="status"
    >
      {children}
    </p>
  );
}

export type OpsPageProps = {
  children: ReactNode;
  className?: string | undefined;
};

export function OpsPage({ children, className }: OpsPageProps) {
  return <div className={cx("hamd-ops-host", className)}>{children}</div>;
}

export type OpsLoadingProps = {
  label?: string | undefined;
  className?: string | undefined;
};

export function OpsLoading({
  label = "Loading…",
  className,
}: OpsLoadingProps) {
  return (
    <div
      className={cx("hamd-ops-host-loading", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="hamd-sr-only">{label}</span>
      <LoadingSkeleton height="2.5rem" className="hamd-ops-host-loading__bar" />
      <LoadingSkeleton height="12rem" className="hamd-ops-host-loading__panel" />
      <LoadingSkeleton height="12rem" className="hamd-ops-host-loading__panel" />
    </div>
  );
}
