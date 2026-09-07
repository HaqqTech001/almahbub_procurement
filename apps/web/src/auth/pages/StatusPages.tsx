import {
  AccountLockedScreen,
  SessionExpiredScreen,
  UnauthorizedScreen,
} from "@hamd/ui/auth";
import { useAuth } from "../session/AuthProvider.js";

export function UnauthorizedPage() {
  return <UnauthorizedScreen loginHref="/login" homeHref="/" />;
}

export function SessionExpiredPage() {
  return <SessionExpiredScreen loginHref="/login" />;
}

export function AccountLockedPage() {
  const { lockUntil } = useAuth();
  const unlockAt = lockUntil
    ? new Date(lockUntil).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : undefined;

  return (
    <AccountLockedScreen
      supportHref="/contact"
      {...(unlockAt ? { unlockAt } : {})}
    />
  );
}
