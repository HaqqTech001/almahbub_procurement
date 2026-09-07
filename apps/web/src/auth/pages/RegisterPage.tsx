import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { RegisterScreen, safeInternalPath, type RegisterFormValues } from "@hamd/ui/auth";
import { googleOAuthStatusRequest, registerRequest } from "../api/auth-client.js";
import { AuthApiError, formatAuthError } from "../api/auth-errors.js";
import {
  GOOGLE_SIGN_IN_FAILURE,
  GoogleSignInButton,
} from "../google/GoogleSignInButton.js";
import { AuthBoot } from "../guards/RequireAuth.js";
import { useAuth } from "../session/AuthProvider.js";

function compactRegisterBody(values: RegisterFormValues): Record<string, unknown> {
  const body: Record<string, unknown> = {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    companyName: values.companyName,
    password: values.password,
    agreeToTerms: values.agreeToTerms,
  };
  if (values.phone.trim()) body.phone = values.phone.trim();
  if (values.companyType.trim()) body.companyType = values.companyType.trim();
  if (values.address.trim()) body.address = values.address.trim();
  if (values.city.trim()) body.city = values.city.trim();
  if (values.state.trim()) body.state = values.state.trim();
  if (values.country.trim()) body.country = values.country.trim();
  return body;
}

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleRetryKey, setGoogleRetryKey] = useState(0);
  const [googleFailed, setGoogleFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const returnTo = safeInternalPath(params.get("returnTo"), "/app");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const status = await googleOAuthStatusRequest();
        if (!cancelled && status.enabled) setGoogleEnabled(true);
      } catch {
        /* optional */
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
    return <AuthBoot label="Preparing registration…" />;
  }

  if (auth.status === "authenticated") {
    return <Navigate to={returnTo} replace />;
  }

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await registerRequest(compactRegisterBody(values));
      navigate(`/otp?email=${encodeURIComponent(values.email)}`, {
        replace: true,
      });
    } catch (err) {
      throw new Error(formatAuthError(err, "Registration failed."));
    } finally {
      setLoading(false);
    }
  };

  const showGoogle =
    googleEnabled && auth.googleSignInAvailable && !auth.bootstrapping;

  return (
    <RegisterScreen
      onSubmit={onSubmit}
      loading={loading}
      errorMessage={error}
      {...(showGoogle
        ? {
            googleSlot: (
              <GoogleSignInButton
                key={googleRetryKey}
                text="signup_with"
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
