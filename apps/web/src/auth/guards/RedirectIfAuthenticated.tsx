import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../session/AuthProvider.js";
import { AuthBoot } from "./RequireAuth.js";

/**
 * Keeps signed-in buyers in the workspace. Visiting marketing home (`/`)
 * while authenticated redirects to `/app` (also covers browser Back).
 */
export function RedirectIfAuthenticated({
  children,
  to = "/app",
}: {
  children: ReactNode;
  to?: string;
}) {
  const { status, bootstrapping } = useAuth();

  if (bootstrapping) {
    return <AuthBoot label="Checking session…" />;
  }

  if (status === "authenticated") {
    return <Navigate to={to} replace />;
  }

  return children;
}
