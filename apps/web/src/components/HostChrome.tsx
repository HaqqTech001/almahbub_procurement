import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useOptionalAuth } from "../auth/session/AuthProvider.js";
import { LoadingSkeleton } from "@hamd/ui/primitives";

import { cx } from "./cx.js";

export type HostAlertProps = {
  children: ReactNode;
  tone?: "danger" | "warning" | "info" | undefined;
  className?: string | undefined;
  action?: ReactNode;
};

/** Shared host alert banner - workspace + public error/warning messaging. */
export function HostAlert({
  children,
  tone = "danger",
  className,
  action,
}: HostAlertProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView?.({ block: "nearest", behavior: "auto" });
  }, [children]);

  return (
    <p
      ref={ref}
      className={cx("hamd-web-alert", `hamd-web-alert--${tone}`, className)}
      role="alert"
      tabIndex={-1}
    >
      {children}
      {action ?? (typeof children === "string" ? <ErrorAction message={children} /> : null)}
    </p>
  );
}

function ErrorAction({ message }: { message: string }) {
  if (/authentication (?:is )?required|sign[ -]in (?:is )?required|session (?:has )?expired|unauthenticated/i.test(message)) return <SessionErrorAction />;
  if (/permission|access denied|forbidden/i.test(message)) return <> <Link to="/app">Return to workspace</Link> <Link to="/contact">Contact support</Link></>;
  if (/unable to load|could not load|couldn't load/i.test(message)) return <> <button type="button" onClick={() => window.location.reload()}>Reload page</button></>;
  return null;
}

/** Refresh a known session before sending an already signed-in buyer to login. */
function SessionErrorAction() {
  const auth = useOptionalAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const loginHref = `/login?returnTo=${encodeURIComponent(location.pathname + location.search + location.hash)}`;
  if (auth?.status !== "authenticated") return <> <Link to={loginHref}>Continue to sign in</Link></>;
  return <> <button type="button" onClick={() => {
    void auth.ensureSession().then((token) => {
      if (token) window.location.reload();
      else navigate(loginHref);
    }).catch(() => navigate(loginHref));
  }}>Retry session</button></>;
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
