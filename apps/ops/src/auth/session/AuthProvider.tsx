import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  loginRequest,
  logoutEverywhereRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  type AuthMePayload,
  type AuthUser,
} from "../api/auth-client.js";
import { AuthApiError, isCredentialFailure } from "../api/auth-errors.js";
import {
  clearLoginFailures,
  getLoginLockUntil,
  isLoginLocked,
  recordLoginFailure,
} from "./client-rate-limit.js";
import {
  clearAccessToken,
  getAccessToken,
  getRememberMe,
  getRememberedEmail,
  hasSessionHint,
  isAccessTokenFresh,
  setAccessToken,
  setRememberMe,
  setSessionHint,
} from "./token-store.js";
import {
  classifyRefreshFailure,
  logSessionEvent,
  statusAfterFailedRefresh,
  withRefreshLock,
} from "@hamd/ui/auth";
import { configureOpsSession } from "./session-http.js";
import {
  clearTrustedDevices,
  getCurrentDeviceFingerprint,
  getCurrentDeviceLabel,
  getCurrentDevicePlatform,
  listTrustedDevices,
  revokeOtherTrustedDevices,
  revokeTrustedDevice,
  touchCurrentDevice,
  trustCurrentDevice,
  type TrustedDevice,
} from "./trusted-devices.js";
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from "./auth-context.js";

export type { AuthContextValue, AuthStatus };
export { useAuth, useOptionalAuth } from "./auth-context.js";

async function hydrateMe(token: string): Promise<AuthMePayload> {
  return meRequest(token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("booting");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [rememberMe, setRememberMeState] = useState(false);
  const [rememberedEmail, setRememberedEmail] = useState("");
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const refreshPromise = useRef<Promise<boolean> | null>(null);
  const lastRefreshKind = useRef<"ok" | "transient" | "expired">("ok");
  const bootstrapGeneration = useRef(0);

  const syncDevices = useCallback(() => {
    setTrustedDevices(listTrustedDevices());
  }, []);

  const applySession = useCallback(
    async (token: string, expiresIn: number, nextUser?: AuthUser, orgId?: string) => {
      setAccessToken(token, expiresIn);
      if (nextUser) setUser(nextUser);
      if (orgId) setOrganizationId(orgId);
      try {
        const me = await hydrateMe(token);
        setUser(me.user);
        setOrganizationId(me.organizationId);
        setOrganizationName(me.organizationName ?? null);
        setPermissions(me.permissions);
      } catch {
        if (nextUser) {
          setPermissions([]);
        } else {
          throw new AuthApiError({
            message: "Unable to load your profile.",
            status: 401,
            code: "UNAUTHENTICATED",
          });
        }
      }
      setStatus("authenticated");
      touchCurrentDevice();
      syncDevices();
    },
    [syncDevices],
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (refreshPromise.current) return refreshPromise.current;
    refreshPromise.current = withRefreshLock(async () => {
      if (isAccessTokenFresh()) {
        lastRefreshKind.current = "ok";
        const token = getAccessToken();
        if (token) {
          try {
            const me = await hydrateMe(token);
            setUser(me.user);
            setOrganizationId(me.organizationId);
            setOrganizationName(me.organizationName ?? null);
            setPermissions(me.permissions);
          } catch {
            /* keep the current profile if /me is temporarily unavailable */
          }
        }
        setStatus("authenticated");
        return true;
      }
      try {
        logSessionEvent("refresh_attempted");
        const session = await refreshRequest(getAccessToken());
        await applySession(
          session.accessToken,
          session.expiresIn,
          session.user,
          session.organizationId,
        );
        lastRefreshKind.current = "ok";
        logSessionEvent("refresh_succeeded");
        return true;
      } catch (error) {
        const category = classifyRefreshFailure(error);
        lastRefreshKind.current = category;
        logSessionEvent("refresh_failed", { category });
        if (category === "expired") {
          logSessionEvent("logout_reason", { reason: "refresh_expired" });
          clearAccessToken();
          setSessionHint(false);
          setUser(null);
          setOrganizationId(null);
          setOrganizationName(null);
          setPermissions([]);
          setStatus("anonymous");
        }
        return false;
      }
    }).finally(() => {
      refreshPromise.current = null;
    });
    return refreshPromise.current;
  }, [applySession]);

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (isAccessTokenFresh()) return getAccessToken();
    const ok = await refreshSession();
    if (ok) return getAccessToken();
    return getAccessToken();
  }, [refreshSession]);

  /**
   * Bootstrap on mount only (stable deps via refs). Clear `bootstrapping` for
   * the latest generation so StrictMode/HMR cancel cannot leave RequireAuth
   * stuck on the auth skeleton forever.
   */
  const refreshSessionRef = useRef(refreshSession);
  refreshSessionRef.current = refreshSession;
  const syncDevicesRef = useRef(syncDevices);
  syncDevicesRef.current = syncDevices;

  useEffect(() => {
    const generation = ++bootstrapGeneration.current;
    let cancelled = false;

    setBootstrapping(true);
    setRememberMeState(getRememberMe());
    setRememberedEmail(getRememberedEmail());
    setLockUntil(getLoginLockUntil());
    syncDevicesRef.current();

    void (async () => {
      try {
        if (isLoginLocked()) {
          if (!cancelled && generation === bootstrapGeneration.current) {
            setStatus("locked");
          }
          return;
        }
        const hadSession = hasSessionHint() || isAccessTokenFresh();
        const recovered = hadSession
          ? await refreshSessionRef.current()
          : false;
        if (cancelled || generation !== bootstrapGeneration.current) return;
        if (!recovered) {
          const next = statusAfterFailedRefresh({
            kind: lastRefreshKind.current === "expired" ? "expired" : "transient",
            hasAccessToken: Boolean(getAccessToken()),
          });
          if (next === "authenticated") {
            setStatus("authenticated");
            window.setTimeout(() => {
              void refreshSessionRef.current();
            }, 2000);
          } else {
            setSessionHint(false);
            setStatus("anonymous");
          }
        }
      } finally {
        if (!cancelled && generation === bootstrapGeneration.current) {
          setBootstrapping(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (input: { email: string; password: string; rememberMe: boolean }) => {
      const lockedUntil = getLoginLockUntil();
      if (lockedUntil) {
        setLockUntil(lockedUntil);
        setStatus("locked");
        throw new AuthApiError({
          message: "Account temporarily locked due to failed sign-in attempts.",
          status: 423,
          code: "ACCOUNT_LOCKED",
        });
      }

      try {
        const session = await loginRequest({
          email: input.email,
          password: input.password,
          rememberMe: input.rememberMe,
          ...(input.rememberMe
            ? {
                deviceFingerprint: getCurrentDeviceFingerprint(),
                deviceName: getCurrentDeviceLabel(),
                devicePlatform: getCurrentDevicePlatform(),
              }
            : {}),
        });
        clearLoginFailures();
        setLockUntil(null);
        setRememberMe(input.rememberMe, input.email);
        setRememberMeState(input.rememberMe);
        setRememberedEmail(input.rememberMe ? input.email : "");
        if (input.rememberMe) {
          trustCurrentDevice();
        }
        await applySession(
          session.accessToken,
          session.expiresIn,
          session.user,
          session.organizationId,
        );
      } catch (error) {
        if (isCredentialFailure(error)) {
          const result = recordLoginFailure();
          if (result.locked) {
            setLockUntil(result.unlockAt);
            setStatus("locked");
          }
        }
        throw error;
      }
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    const token = getAccessToken();
    try {
      if (token) await logoutRequest(token);
    } catch {
      /* still clear local session */
    }
    clearAccessToken();
    setSessionHint(false);
    setUser(null);
    setOrganizationId(null);
    setOrganizationName(null);
    setPermissions([]);
    setStatus("anonymous");
  }, []);

  const logoutEverywhere = useCallback(async () => {
    const token = getAccessToken();
    try {
      if (token) await logoutEverywhereRequest(token);
    } catch {
      /* clear locally anyway */
    }
    clearAccessToken();
    setSessionHint(false);
    clearTrustedDevices();
    syncDevices();
    setUser(null);
    setOrganizationId(null);
    setOrganizationName(null);
    setPermissions([]);
    setStatus("anonymous");
  }, [syncDevices]);

  useEffect(() => {
    configureOpsSession({
      getAccessToken,
      ensureSession: () => ensureSession(),
      refreshSession: async () => {
        const ok = await refreshSession();
        if (ok) return true;
        return lastRefreshKind.current === "transient" ? "transient" : false;
      },
      onSessionLost: () => {
        clearAccessToken();
        setSessionHint(false);
        setUser(null);
        setOrganizationId(null);
        setOrganizationName(null);
        setPermissions([]);
        setStatus("anonymous");
      },
    });
    return () => configureOpsSession(null);
  }, [ensureSession, refreshSession]);

  useEffect(() => {
    if (!import.meta.env.DEV || !bootstrapping) return;
    const started = Date.now();
    const timer = window.setTimeout(() => {
      logSessionEvent("bootstrap_slow", { elapsedMs: Date.now() - started });
    }, 8_000);
    return () => window.clearTimeout(timer);
  }, [bootstrapping]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      organizationId,
      organizationName,
      permissions,
      bootstrapping,
      rememberMe,
      rememberedEmail,
      trustedDevices,
      lockUntil,
      login,
      logout,
      logoutEverywhere,
      refreshSession,
      ensureSession,
      revokeDevice: (id: string) => {
        revokeTrustedDevice(id);
        syncDevices();
      },
      revokeOtherDevices: () => {
        revokeOtherTrustedDevices();
        syncDevices();
      },
      markExpired: () => {
        clearAccessToken();
        setSessionHint(false);
        setUser(null);
        setOrganizationId(null);
        setOrganizationName(null);
        setPermissions([]);
        setStatus("anonymous");
      },
    }),
    [
      status,
      user,
      organizationId,
      organizationName,
      permissions,
      bootstrapping,
      rememberMe,
      rememberedEmail,
      trustedDevices,
      lockUntil,
      login,
      logout,
      logoutEverywhere,
      refreshSession,
      ensureSession,
      syncDevices,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
