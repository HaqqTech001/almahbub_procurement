import { createContext, useContext } from "react";

import type { AuthUser } from "../api/auth-client.js";
import type { TrustedDevice } from "./trusted-devices.js";

export type AuthStatus =
  | "booting"
  | "anonymous"
  | "authenticated"
  | "expired"
  | "locked";

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  organizationId: string | null;
  organizationName: string | null;
  permissions: string[];
  bootstrapping: boolean;
  rememberMe: boolean;
  rememberedEmail: string;
  trustedDevices: TrustedDevice[];
  lockUntil: number | null;
  login: (input: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  ensureSession: () => Promise<string | null>;
  revokeDevice: (id: string) => void;
  revokeOtherDevices: () => void;
  markExpired: () => void;
};

/**
 * Isolated so Vite Fast Refresh can re-evaluate AuthProvider or lazy route
 * chunks (e.g. WeddingCampaignPage?t=…) without minting a second context
 * identity. That mismatch surfaces as
 * "useAuth must be used within AuthProvider" under the existing provider.
 */
export const AuthContext =
  (import.meta.hot?.data?.AuthContext as
    | ReturnType<typeof createContext<AuthContextValue | null>>
    | undefined) ?? createContext<AuthContextValue | null>(null);

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose((data) => {
    data.AuthContext = AuthContext;
  });
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}
