import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LoadingSkeleton } from "@hamd/ui/primitives";

import { cx } from "./cx.js";

export type HostAlertProps = {
  children: ReactNode;
  tone?: "danger" | "warning" | "info" | undefined;
  className?: string | undefined;
};

/** Shared host alert banner - workspace + public error/warning messaging. */
export function HostAlert({
  children,
  tone = "danger",
  className,
}: HostAlertProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [children]);

  return (
    <p
      ref={ref}
      className={cx("hamd-web-alert", `hamd-web-alert--${tone}`, className)}
      role="alert"
      tabIndex={-1}
    >
      {children}
    </p>
  );
}

export type HostStatusProps = {
  children: ReactNode;
  tone?: "neutral" | "success" | undefined;
  className?: string | undefined;
};

/** Shared host status / success chip. */
export function HostStatus({
  children,
  tone = "neutral",
  className,
}: HostStatusProps) {
  return (
    <p
      className={cx("hamd-web-status", `hamd-web-status--${tone}`, className)}
      role="status"
    >
      {children}
    </p>
  );
}

export type HostPageProps = {
  children: ReactNode;
  className?: string | undefined;
};

/** Shared workspace module page wrapper for consistent spacing. */
export function HostPage({ children, className }: HostPageProps) {
  return <div className={cx("hamd-web-host", className)}>{children}</div>;
}

export type HostLoadingProps = {
  label?: string | undefined;
  className?: string | undefined;
};

/** Shared loading skeleton for host subroutes without package workspaces. */
export function HostLoading({
  label = "Loading…",
  className,
}: HostLoadingProps) {
  return (
    <div
      className={cx("hamd-web-host-loading", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="hamd-sr-only">{label}</span>
      <LoadingSkeleton height="2.5rem" className="hamd-web-host-loading__bar" />
      <LoadingSkeleton height="12rem" className="hamd-web-host-loading__panel" />
      <LoadingSkeleton height="12rem" className="hamd-web-host-loading__panel" />
    </div>
  );
}

export type HostBackLinkProps = {
  to: string;
  children: ReactNode;
  className?: string | undefined;
};

/** Consistent module back-link treatment - SPA navigation (no full reload). */
export function HostBackLink({ to, children, className }: HostBackLinkProps) {
  return (
    <p className={cx("hamd-web-host-back", className)}>
      <Link className="hamd-web-host-back__link" to={to}>
        {children}
      </Link>
    </p>
  );
}
