import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { AuthAlert, AuthShell, safeInternalPath } from "@hamd/ui/auth";
import { useAuth } from "../session/AuthProvider.js";
import { setSessionHint } from "../session/token-store.js";

function safeReturnTo(value: string | null): string {
  return safeInternalPath(value, "/app");
}

/**
 * Completes Google OAuth after the API sets the refresh cookie and redirects here.
 * Establishes the in-memory access token via the existing refresh flow.
 */
export function OAuthCompletePage() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"));
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setSessionHint(true);
      const ok = await auth.refreshSession();
      if (cancelled) return;
      if (!ok) {
        setError("We could not finish signing you in. Please try again.");
        return;
      }
      setDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [auth]);

  if (done || auth.status === "authenticated") {
    return <Navigate to={returnTo} replace />;
  }

  return (
    <AuthShell
      variant="login"
      title="Finishing sign-in"
      description="Confirming your Almahbub International session."
      documentTitle="Sign in · Almahbub International"
      loading={!error}
    >
      {error ? (
        <AuthAlert tone="error" title="Sign-in incomplete">
          {error}{" "}
          <a className="hamd-auth-link" href="/login">
            Return to sign in
          </a>
        </AuthAlert>
      ) : (
        <p>Signing you in…</p>
      )}
    </AuthShell>
  );
}
