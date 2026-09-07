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
  const unlockAt = lockUntil
    ? new Date(lockUntil).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : undefined;

  return (
    <AccountLockedScreen
      supportHref="/support"
      {...(unlockAt ? { unlockAt } : {})}
    />
  );
}
