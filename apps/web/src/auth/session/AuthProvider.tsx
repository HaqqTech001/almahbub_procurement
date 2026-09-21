import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  googleSignInRequest,
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
  googleClientIdFromEnv,
  initializeGoogleIdentity,
  loadGoogleIdentityScript,
} from "../google/gis.js";
import { setPendingGoogleCredential } from "../google/pending-credential.js";
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
import { configureWebSession } from "./session-http.js";
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

export type AuthStatus =
  | "booting"
  | "anonymous"
  | "authenticated"
  | "expired"
  | "locked";

type AuthContextValue = {
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
  loginWithGoogle: (
    credential: string,
    extra?: { code?: string; email?: string },
  ) => Promise<void>;
  registerGoogleCredentialHandler: (
    handler: (credential: string) => void,
  ) => () => void;
  googleSignInReady: boolean;
  googleSignInAvailable: boolean;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  ensureSession: () => Promise<string | null>;
  persistRememberMe: (enabled: boolean) => void;
  revokeDevice: (id: string) => void;
  revokeOtherDevices: () => void;
  markExpired: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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
  const [googleSignInReady, setGoogleSignInReady] = useState(false);
  const [googleSignInFailed, setGoogleSignInFailed] = useState(false);
  const googleCredentialHandler = useRef<((credential: string) => void) | null>(
    null,
  );
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

  useEffect(() => {
    const clientId = googleClientIdFromEnv();
    if (!clientId) return;
    let cancelled = false;
    void loadGoogleIdentityScript()
      .then((api) => {
        if (cancelled) return;
        initializeGoogleIdentity(api, clientId, (credential) => {
          googleCredentialHandler.current?.(credential);
        });
        setGoogleSignInReady(true);
      })
      .catch(() => {
        if (!cancelled) setGoogleSignInFailed(true);
      });
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

  const loginWithGoogle = useCallback(
    async (
      credential: string,
      extra?: { code?: string; email?: string },
    ) => {
      try {
        const session = await googleSignInRequest({
          credential,
          ...(extra?.code ? { code: extra.code } : {}),
          ...(extra?.email ? { email: extra.email } : {}),
        });
        await applySession(
          session.accessToken,
          session.expiresIn,
          session.user,
          session.organizationId,
        );
      } catch (error) {
        if (error instanceof AuthApiError && error.isGoogleLinkRequired) {
          setPendingGoogleCredential(credential);
        }
        throw error;
      }
    },
    [applySession],
  );

  const registerGoogleCredentialHandler = useCallback(
    (handler: (credential: string) => void) => {
      googleCredentialHandler.current = handler;
      return () => {
        if (googleCredentialHandler.current === handler) {
          googleCredentialHandler.current = null;
        }
      };
    },
    [],
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
    configureWebSession({
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
    return () => configureWebSession(null);
  }, [ensureSession, refreshSession]);

  useEffect(() => {
    if (!import.meta.env.DEV || !bootstrapping) return;
    const started = Date.now();
    const timer = window.setTimeout(() => {
      logSessionEvent("bootstrap_slow", { elapsedMs: Date.now() - started });
    }, 8_000);
    return () => window.clearTimeout(timer);
  }, [bootstrapping]);

  const persistRememberMe = useCallback(
    (enabled: boolean) => {
      setRememberMe(enabled, enabled ? (user?.email ?? rememberedEmail) || undefined : undefined);
      setRememberMeState(enabled);
      if (!enabled) setRememberedEmail("");
    },
    [rememberedEmail, user?.email],
  );

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
      loginWithGoogle,
      registerGoogleCredentialHandler,
      googleSignInReady,
      googleSignInAvailable:
        Boolean(googleClientIdFromEnv()) && !googleSignInFailed,
      logout,
      logoutEverywhere,
      refreshSession,
      ensureSession,
      persistRememberMe,
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
      loginWithGoogle,
      registerGoogleCredentialHandler,
      googleSignInReady,
      googleSignInFailed,
      logout,
      logoutEverywhere,
      refreshSession,
      ensureSession,
      persistRememberMe,
      syncDevices,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}
