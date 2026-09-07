import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { LoginScreen, safeInternalPath, type LoginFormValues } from "@hamd/ui/auth";
import { googleOAuthStatusRequest } from "../api/auth-client.js";
import { AuthApiError, formatAuthError } from "../api/auth-errors.js";
import {
  GOOGLE_SIGN_IN_FAILURE,
  GoogleSignInButton,
} from "../google/GoogleSignInButton.js";
import { AuthBoot } from "../guards/RequireAuth.js";
import { useAuth } from "../session/AuthProvider.js";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleRetryKey, setGoogleRetryKey] = useState(0);
  const [googleFailed, setGoogleFailed] = useState(false);

  const fromState = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)
    ?.from;
  const returnTo = safeInternalPath(
    params.get("returnTo") ??
      (fromState
        ? `${fromState.pathname ?? ""}${fromState.search ?? ""}${fromState.hash ?? ""}`
        : null),
    "/app",
  );

  useEffect(() => {
    const oauthError = params.get("oauthError");
    if (oauthError) setError(oauthError);
  }, [params]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const status = await googleOAuthStatusRequest();
        if (!cancelled && status.enabled) setGoogleEnabled(true);
      } catch {
        /* Google remains unavailable - password still works. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onGoogleCredential = useCallback(
    async (credential: string) => {
      setError(null);
      setGoogleFailed(false);
      try {
        await auth.loginWithGoogle(credential);
        navigate(returnTo, { replace: true });
      } catch (err) {
        if (err instanceof AuthApiError && err.isGoogleLinkRequired) {
          const email = err.linkedEmail;
          const otp = new URLSearchParams();
          if (email) otp.set("email", email);
          otp.set("googleLink", "1");
          otp.set("returnTo", returnTo);
          navigate(`/otp?${otp.toString()}`, { replace: true });
          return;
        }
        setGoogleFailed(true);
        setError(GOOGLE_SIGN_IN_FAILURE);
      }
    },
    [auth, navigate, returnTo],
  );

  if (auth.bootstrapping) {
    return <AuthBoot label="Preparing sign in…" />;
  }

  if (auth.status === "locked") {
    return <Navigate to="/account-locked" replace />;
  }

  if (auth.status === "authenticated") {
    return <Navigate to={returnTo} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    try {
      await auth.login(values);
      navigate(returnTo, { replace: true });
    } catch (err) {
      if (err instanceof AuthApiError && err.isLocked) {
        navigate("/account-locked", { replace: true });
        return;
      }
      if (err instanceof AuthApiError && err.isUnverified) {
        navigate(`/otp?email=${encodeURIComponent(values.email)}`, {
          replace: true,
        });
        return;
      }
      setError(formatAuthError(err, "Unable to sign in."));
    }
  };

  const verified = params.get("verified") === "1";
  const initialEmail = params.get("email") || auth.rememberedEmail;
  const showGoogle =
    googleEnabled && auth.googleSignInAvailable && !auth.bootstrapping;

  return (
    <LoginScreen
      onSubmit={onSubmit}
      {...(initialEmail ? { initialEmail } : {})}
      errorMessage={error}
      successMessage={
        verified
          ? "Email verified. Sign in to continue."
          : auth.rememberMe
            ? "Welcome back. Your device preference is remembered."
            : null
      }
      {...(showGoogle
        ? {
            googleSlot: (
              <GoogleSignInButton
                key={googleRetryKey}
                text="signin_with"
                onCredential={onGoogleCredential}
                showRetry={googleFailed}
                onRetry={() => {
                  setError(null);
                  setGoogleFailed(false);
                  setGoogleRetryKey((value) => value + 1);
                }}
              />
            ),
          }
        : {})}
    />
  );
}
