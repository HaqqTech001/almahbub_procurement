import { useState, type FormEvent } from "react";
import { AuthShell } from "../AuthShell.js";
import {
  AuthAlert,
  AuthFloatingField,
  AuthPasswordField,
  AuthSubmitButton,
} from "../AuthFields.js";
import { isStrongEnough } from "../validation.js";

export type StatusScreenProps = {
  loginHref?: string;
  homeHref?: string;
  supportHref?: string;
  loading?: boolean | undefined;
};

export function SessionExpiredScreen({
  loginHref = "/login",
  loading,
}: StatusScreenProps) {
  return (
    <AuthShell
      variant="session"
      title="Session expired"
      description="For security, inactive sessions end automatically."
      documentTitle="Session expired · Almahbub International"
      loading={loading}
    >
      <AuthAlert tone="warning" title="Sign in again">
        Your previous session is no longer valid. Continue where you left off
        after signing in.
      </AuthAlert>
      <p className="hamd-auth-cta-wrap">
        <a href={loginHref} className="hamd-auth-submit hamd-auth-submit--link">
          Sign in
        </a>
      </p>
    </AuthShell>
  );
}

export function UnauthorizedScreen({
  loginHref = "/login",
  homeHref = "/",
  loading,
}: StatusScreenProps) {
  return (
    <AuthShell
      variant="unauthorized"
      title="Unauthorized"
      description="This area requires an authenticated session."
      documentTitle="Unauthorized · Almahbub International"
      loading={loading}
    >
      <AuthAlert tone="error" title="401 - Sign in required">
        You are not signed in, or your credentials were not accepted for this
        request.
      </AuthAlert>
      <div className="hamd-auth-form__actions">
        <a href={loginHref} className="hamd-auth-submit hamd-auth-submit--link">
          Sign in
        </a>
        <a href={homeHref} className="hamd-auth-secondary">
          Go home
        </a>
      </div>
    </AuthShell>
  );
}

export function ForbiddenScreen({
  homeHref = "/",
  supportHref = "/contact",
  loading,
}: StatusScreenProps) {
  return (
    <AuthShell
      variant="forbidden"
      title="Forbidden"
      description="Your role does not include this action."
      documentTitle="Forbidden · Almahbub International"
      loading={loading}
    >
      <AuthAlert tone="error" title="403 - Access denied">
        If you believe this is a mistake, ask an organization administrator to
        adjust your permissions.
      </AuthAlert>
      <div className="hamd-auth-form__actions">
        <a href={homeHref} className="hamd-auth-submit hamd-auth-submit--link">
          Go home
        </a>
        <a href={supportHref} className="hamd-auth-secondary">
          Contact support
        </a>
      </div>
    </AuthShell>
  );
}

export function AccountLockedScreen({
  supportHref = "/contact",
  unlockAt,
  remainingSeconds,
  loginHref = "/login",
  loading,
}: StatusScreenProps & { unlockAt?: string; remainingSeconds?: number }) {
  return (
    <AuthShell
      variant="locked"
      title="Account locked"
      description="Too many failed sign-in attempts triggered a temporary lock."
      documentTitle="Account locked · Almahbub International"
      loading={loading}
    >
      <AuthAlert tone="warning" title="Temporarily unavailable">
        {remainingSeconds && remainingSeconds > 0
          ? `Try again in ${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}.`
          : unlockAt ? `Try again after ${unlockAt}.` : "Return to sign in to check whether the cooldown has ended."}
      </AuthAlert>
      <p className="hamd-auth-cta-wrap">
        <a href={loginHref} className="hamd-auth-submit hamd-auth-submit--link">Return to sign in</a>
      </p>
      <p><a href={supportHref} className="hamd-auth-link">Contact support</a>
      </p>
    </AuthShell>
  );
}

export type InvitationAcceptanceScreenProps = {
  organizationName?: string;
  inviterName?: string;
  email?: string;
  onAccept: (values: {
    password: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
  }) => void | Promise<void>;
  onDecline?: (() => void | Promise<void>) | undefined;
  requirePassword?: boolean | undefined;
  loading?: boolean | undefined;
};

export function InvitationAcceptanceScreen({
  organizationName = "your organization",
  inviterName,
  email,
  onAccept,
  onDecline,
  requirePassword = true,
  loading,
}: InvitationAcceptanceScreenProps) {
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (requirePassword && !isStrongEnough(password)) {
      setError("Use 8+ characters with upper, lower, and a number.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onAccept({
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to accept invitation.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      variant="invite"
      title="Accept invitation"
      description={
        inviterName
          ? `${inviterName} invited you to join ${organizationName}.`
          : `Join ${organizationName} on Almahbub International.`
      }
      documentTitle="Accept invitation · Almahbub International"
      loading={loading}
    >
      <form className="hamd-auth-form" onSubmit={handleSubmit} noValidate>
        {formError ? (
          <AuthAlert tone="error" title="Invitation failed">
            {formError}
          </AuthAlert>
        ) : null}
        {email ? (
          <AuthFloatingField
            label="Email"
            type="email"
            value={email}
            readOnly
            disabled
          />
        ) : null}
        <AuthFloatingField
          label="First name"
          name="firstName"
          autoComplete="given-name"
          value={firstName}
          autoFocus
          onChange={(e) => setFirstName(e.target.value)}
        />
        <AuthFloatingField
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        {requirePassword ? (
          <AuthPasswordField
            label="Create password"
            name="password"
            autoComplete="new-password"
            showStrength
            value={password}
            error={error}
            onChange={(e) => setPassword(e.target.value)}
          />
        ) : null}
        <div className="hamd-auth-form__actions">
          {onDecline ? (
            <button
              type="button"
              className="hamd-auth-secondary"
              onClick={() => void onDecline()}
            >
              Decline
            </button>
          ) : null}
          <AuthSubmitButton loading={submitting}>
            Accept invitation
          </AuthSubmitButton>
        </div>
      </form>
    </AuthShell>
  );
}

export function MfaPlaceholderScreen({
  loginHref = "/login",
  loading,
}: StatusScreenProps) {
  return (
    <AuthShell
      variant="mfa"
      title="Multi-factor authentication"
      description="MFA will strengthen high-risk actions. This screen is a placeholder only."
      documentTitle="MFA · Almahbub International"
      loading={loading}
      footer={
        <p>
          <a href={loginHref} className="hamd-auth-link">
            Back to sign in
          </a>
        </p>
      }
    >
      <AuthAlert tone="info" title="Coming soon">
        No MFA challenge is active yet. Host apps should not fake a verification
        step here.
      </AuthAlert>
    </AuthShell>
  );
}
