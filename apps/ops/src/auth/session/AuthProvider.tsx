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
import { AuthApiError } from "../api/auth-errors.js";
import {
  clearLoginFailures,
  getLoginLockUntil,
  rememberLoginLock,
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
  const [lockUntil, setLockUntil] = useState<number | null>(getLoginLockUntil);
  const refreshPromise = useRef<Promise<boolean> | null>(null);
  const lastRefreshKind = useRef<"ok" | "transient" | "expired">("ok");
  const bootstrapGeneration = useRef(0);
  const sessionEpoch = useRef(0);

  useEffect(() => {
    if (lockUntil === null) return;
    const expire = () => {
      if (lockUntil <= Date.now()) {
        clearLoginFailures();
        setLockUntil(null);
        setStatus(current => current === "locked" ? "anonymous" : current);
      }
    };
    expire();
    const timer = window.setInterval(expire, 1000);
    window.addEventListener("focus", expire);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", expire); };
  }, [lockUntil]);

  const syncDevices = useCallback(() => {
    setTrustedDevices(listTrustedDevices());
  }, []);

  const applySession = useCallback(
    async (token: string, expiresIn: number, nextUser?: AuthUser, orgId?: string) => {
      const epoch = sessionEpoch.current;
      setAccessToken(token, expiresIn);
      if (nextUser) setUser(nextUser);
      if (orgId) setOrganizationId(orgId);
      try {
        const me = await hydrateMe(token);
        if (epoch !== sessionEpoch.current) return;
        setUser(me.user);
        setOrganizationId(me.organizationId);
        setOrganizationName(me.organizationName ?? null);
        setPermissions(me.permissions);
      } catch (error) {
        if (epoch !== sessionEpoch.current) return;
        if (error instanceof AuthApiError && error.status === 401) throw error;
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
      if (epoch !== sessionEpoch.current) return;
      clearLoginFailures();
      setLockUntil(null);
      setStatus("authenticated");
      touchCurrentDevice();
      syncDevices();
    },
    [syncDevices],
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (refreshPromise.current) return refreshPromise.current;
    const epoch = sessionEpoch.current;
    refreshPromise.current = withRefreshLock(async () => {
      try {
        logSessionEvent("refresh_attempted");
        const session = await refreshRequest(getAccessToken());
        if (epoch !== sessionEpoch.current) return false;
        await applySession(
          session.accessToken,
          session.expiresIn,
          session.user,
          session.organizationId,
        );
        if (epoch !== sessionEpoch.current) return false;
        lastRefreshKind.current = "ok";
        logSessionEvent("refresh_succeeded");
        return true;
      } catch (error) {
        if (epoch !== sessionEpoch.current) return false;
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
          setStatus("expired");
        }
        return false;
      }
    }).finally(() => {
      refreshPromise.current = null;
    });
    return refreshPromise.current;
  }, [applySession]);

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (!getAccessToken() && !hasSessionHint()) return null;
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
            if (lastRefreshKind.current === "expired") setSessionHint(false);
            setStatus(hadSession && lastRefreshKind.current === "expired" ? "expired" : "anonymous");
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
        if (error instanceof AuthApiError && error.isLocked) {
          setLockUntil(rememberLoginLock(error.retryAfterSeconds));
          setStatus("locked");
        }
        throw error;
      }
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    sessionEpoch.current += 1;
    const token = getAccessToken();
    clearAccessToken();
    setSessionHint(false);
    setUser(null);
    setStatus("anonymous");
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
    sessionEpoch.current += 1;
    const token = getAccessToken();
    clearAccessToken();
    setSessionHint(false);
    setUser(null);
    setStatus("anonymous");
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
        setStatus("expired");
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
