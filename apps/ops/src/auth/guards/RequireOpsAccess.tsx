import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../session/AuthProvider.js";

export function hasOpsAccess(permissions: string[]): boolean {
  return permissions.includes("ops:access");
}

/**
 * Permission gate for Operations Console - after authentication.
 * Buyers without ops:access are blocked here; the API also rejects them.
 */
export function RequireOpsAccess({ children }: { children: ReactNode }) {
  const { permissions, status } = useAuth();

  if (status !== "authenticated") {
    return children;
  }

  if (!hasOpsAccess(permissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
