import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { LoginScreen, useRequestCooldown, safeInternalPath, type LoginFormValues } from "@hamd/ui/auth";
import { ThemeToggle } from "../../components/ThemeToggle.js";
import { AuthApiError, formatAuthError } from "../api/auth-errors.js";
import { AuthBoot } from "../guards/RequireAuth.js";
import { useAuth } from "../session/AuthProvider.js";

export function LoginPage() {
  const auth = useAuth();
  const cooldown = useRequestCooldown();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const fromState = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)
    ?.from;
  const returnTo = safeInternalPath(
    params.get("returnTo") ??
      (fromState
        ? `${fromState.pathname ?? ""}${fromState.search ?? ""}${fromState.hash ?? ""}`
        : null),
    "/",
  );

  useEffect(() => {
    const oauthError = params.get("oauthError");
    if (oauthError) setError("Google sign-in could not be completed. Please try again.");
    else if (params.get("reason") === "session-expired") setError("Your session has expired. Sign in again to continue.");
  }, [params]);

  if (auth.bootstrapping) {
    return <AuthBoot label="Preparing operations sign in…" />;
  }

  if (auth.status === "locked" && auth.lockUntil !== null && auth.lockUntil > Date.now()) {
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
      if (err instanceof AuthApiError && err.isRateLimited) {
        cooldown.start(err.retryAfterSeconds);
        if (!err.retryAfterSeconds) setError(formatAuthError(err, "Sign-in requests are temporarily limited."));
        return;
      }
      if (err instanceof AuthApiError && err.isLocked) {
        navigate("/account-locked", { replace: true });
        return;
      }
      if (err instanceof AuthApiError && err.isUnverified) {
        setError(
          "This account still needs email verification. Complete verification on the buyer website, then sign in here.",
        );
        return;
      }
      setError(formatAuthError(err, "Unable to sign in."));
    }
  };

  const verified = params.get("verified") === "1";
  const initialEmail = params.get("email") || auth.rememberedEmail;

  return (
    <div className="hamd-ops-auth">
      <div className="hamd-ops-auth__theme">
        <ThemeToggle />
      </div>
      <LoginScreen
        onSubmit={onSubmit}
        brandLabel="Almahbub Operations"
        description="Sign in to the Almahbub International operations console."
        documentTitle="Sign in · Almahbub Operations"
        registerHref={null}
        {...(initialEmail ? { initialEmail } : {})}
        errorMessage={error}
      requestCooldownMessage={cooldown.message}
        successMessage={
          verified
            ? "Email verified. Sign in to continue."
            : auth.rememberMe
              ? "Welcome back. Your device preference is remembered."
              : null
        }
      />
    </div>
  );
}
