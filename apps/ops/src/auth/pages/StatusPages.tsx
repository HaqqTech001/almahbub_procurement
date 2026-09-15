import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  AccountLockedScreen,
  ForbiddenScreen,
  SessionExpiredScreen,
} from "@hamd/ui/auth";
import { useAuth } from "../session/AuthProvider.js";

export function UnauthorizedPage() {
  return (
    <div className="hamd-ops-auth">
      <ForbiddenScreen
        homeHref="/login"
        supportHref="/login"
      />
    </div>
  );
}

export function SessionExpiredPage() {
  return <SessionExpiredScreen loginHref="/login" />;
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
  return <AccountLockedScreen supportHref="mailto:almahbubinternational@gmail.com" remainingSeconds={Math.ceil((lockUntil - now) / 1000)} />;
}
