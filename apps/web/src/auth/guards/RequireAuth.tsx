import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { LoadingSkeleton } from "@hamd/ui/primitives";
import { useAuth } from "../session/AuthProvider.js";

export function AuthBoot({
  label = "Restoring session…",
}: {
  label?: string;
}) {
  return (
    <div className="hamd-auth-boot" aria-busy="true" aria-live="polite">
      <span className="hamd-sr-only">{label}</span>
      <LoadingSkeleton height="3rem" />
      <LoadingSkeleton height="40vh" />
    </div>
  );
}

/**
 * Gate authenticated app routes.
 * Anonymous users are sent to Sign In (not Unauthorized) with return path preserved.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return <AuthBoot />;
  }

  if (status === "booting") {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
        replace
        state={{ from: location }}
      />
    );
  }

  if (status === "locked") {
    return <Navigate to="/account-locked" replace />;
  }

  if (status !== "authenticated") {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}
