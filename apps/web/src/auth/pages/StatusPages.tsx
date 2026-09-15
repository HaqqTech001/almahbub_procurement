import { useEffect, useState } from "react";
import {
  AccountLockedScreen,
  SessionExpiredScreen,
  UnauthorizedScreen,
} from "@hamd/ui/auth";
import { useAuth } from "../session/AuthProvider.js";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { safeInternalPath } from "@hamd/ui/auth";

export function UnauthorizedPage() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const returnTo = safeInternalPath(params.get("returnTo"), "/app");
  if (auth.status === "authenticated") return <main className="hamd-web-host">
    <h1>Access restricted</h1><p>Your account does not have permission to open this page.</p>
    <Link to="/app">Return to your workspace</Link> <Link to="/contact">Contact support</Link>
  </main>;
  return <UnauthorizedScreen loginHref={`/login?returnTo=${encodeURIComponent(returnTo)}`} homeHref="/" />;
}

export function SessionExpiredPage() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const requested = safeInternalPath(params.get("returnTo"), "/app");
  const returnTo = /^\/(login|register|session-expired|unauthorized)(\/|\?|#|$)/.test(requested) ? "/app" : requested;
  if (auth.status === "authenticated") return <Navigate to={returnTo} replace />;
  return <SessionExpiredScreen loginHref={`/login?returnTo=${encodeURIComponent(returnTo)}`} />;
}

export function AccountLockedPage() {
  const { lockUntil } = useAuth();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    window.addEventListener("focus", tick);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", tick); };
  }, []);
  // Recheck authorization on the next explicit sign-in, never by querying an email.
  if (!lockUntil || lockUntil <= now) return <Navigate to="/login" replace />;
  return <AccountLockedScreen supportHref="/contact" remainingSeconds={Math.ceil((lockUntil - now) / 1000)} />;
}
