import { useEffect, useState, type FormEvent } from "react";
import { AuthShell } from "../AuthShell.js";
import {
  AuthAlert,
  AuthFloatingField,
  AuthPasswordField,
  AuthSubmitButton,
} from "../AuthFields.js";
import { isStrongEnough, isValidEmail, PASSWORD_POLICY_HINT } from "../validation.js";

export type ForgotPasswordScreenProps = {
  onSubmit: (email: string) => void | Promise<void>;
  loginHref?: string;
  loading?: boolean | undefined;
};

export function ForgotPasswordScreen({
  onSubmit,
  loginHref = "/login",
  loading,
}: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(email.trim());
      setSuccess(true);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to send reset email.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      variant="forgot"
      title="Forgot password"
      description="We’ll email a secure reset link after your email is verified. Unverified accounts get a verification email first."
      documentTitle="Forgot password · Almahbub International"
      loading={loading}
      footer={
        <p>
          <a href={loginHref} className="hamd-auth-link">
            Back to sign in
          </a>
        </p>
      }
    >
      {success ? (
        <AuthAlert tone="success" title="Check your email">
          If an account exists for that email, password reset instructions have
          been sent.
        </AuthAlert>
      ) : (
        <form className="hamd-auth-form" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <AuthAlert tone="error" title="Request failed">
              {formError}
            </AuthAlert>
          ) : null}
          <AuthFloatingField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            error={error}
            autoFocus
            onChange={(e) => {
              setEmail(e.target.value);
              if (error && isValidEmail(e.target.value)) setError(undefined);
            }}
          />
          <AuthSubmitButton loading={submitting}>Send reset link</AuthSubmitButton>
        </form>
      )}
    </AuthShell>
  );
}

export type ResetPasswordScreenProps = {
  onSubmit: (password: string) => void | Promise<void>;
  token?: string;
  loginHref?: string;
  loading?: boolean | undefined;
};

export function ResetPasswordScreen({
  onSubmit,
  loginHref = "/login",
  loading,
}: ResetPasswordScreenProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!isStrongEnough(password)) next.password = PASSWORD_POLICY_HINT;
    if (password !== confirm) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(password);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to reset password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      variant="reset"
      title="Reset password"
      description="Choose a new password for your account."
      documentTitle="Reset password · Almahbub International"
      loading={loading}
      footer={
        <p>
          <a href={loginHref} className="hamd-auth-link">
            Back to sign in
          </a>
        </p>
      }
    >
      <form className="hamd-auth-form" onSubmit={handleSubmit} noValidate>
        {formError ? (
          <AuthAlert tone="error" title="Reset failed">
            {formError}
          </AuthAlert>
        ) : null}
        <AuthPasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          showStrength
          value={password}
          error={errors.password}
          autoFocus
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="hamd-auth-fineprint">{PASSWORD_POLICY_HINT}</p>
        <AuthPasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirm}
          error={errors.confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <AuthSubmitButton loading={submitting}>Update password</AuthSubmitButton>
      </form>
    </AuthShell>
  );
}

export function PasswordChangedScreen({
  loginHref = "/login",
  loading,
}: {
  loginHref?: string;
  loading?: boolean | undefined;
}) {
  return (
    <AuthShell
      variant="success"
      title="Password changed"
      description="Your credentials were updated successfully."
      documentTitle="Password changed · Almahbub International"
      loading={loading}
    >
      <AuthAlert tone="success" title="All set">
        You can sign in with your new password.
      </AuthAlert>
      <p className="hamd-auth-cta-wrap">
        <a href={loginHref} className="hamd-auth-submit hamd-auth-submit--link">
          Continue to sign in
        </a>
      </p>
    </AuthShell>
  );
}

export type EmailVerificationScreenProps = {
  status?: "pending" | "success" | "error" | "loading";
  message?: string;
  onVerify?: (token: string) => void | Promise<void>;
  token?: string;
  loginHref?: string;
  resendHref?: string;
  loading?: boolean | undefined;
};

export function EmailVerificationScreen({
  status = "pending",
  message,
  onVerify,
  token,
  loginHref = "/login",
  resendHref = "/resend-verification",
  loading,
}: EmailVerificationScreenProps) {
  const [localStatus, setLocalStatus] = useState(status);
  const [localMessage, setLocalMessage] = useState(message);

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  useEffect(() => {
    if (!token || !onVerify || status !== "pending") return;
    let cancelled = false;
    (async () => {
      try {
        await onVerify(token);
        if (!cancelled) setLocalStatus("success");
      } catch (err) {
        if (!cancelled) {
          setLocalStatus("error");
          setLocalMessage(
            err instanceof Error ? err.message : "Verification failed.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, onVerify, status]);

  const shellLoading = loading || localStatus === "loading";

  return (
    <AuthShell
      variant="verify"
      title="Email verification"
      description="Confirming your address keeps organization accounts accountable."
      documentTitle="Verify email · Almahbub International"
      loading={shellLoading}
      footer={
        <p>
          <a href={loginHref} className="hamd-auth-link">
            Back to sign in
          </a>
        </p>
      }
    >
      {localStatus === "success" ? (
        <AuthAlert tone="success" title="Email verified">
          Your account is ready. You can sign in now.
        </AuthAlert>
      ) : null}
      {localStatus === "error" ? (
        <>
          <AuthAlert tone="error" title="Verification failed">
            {localMessage ?? "This link is invalid or expired."}
          </AuthAlert>
          <p>
            <a href={resendHref} className="hamd-auth-link">
              Resend verification email
            </a>
          </p>
        </>
      ) : null}
      {localStatus === "pending" && !token ? (
        <AuthAlert tone="info" title="Check your inbox">
          Open the verification link we sent, or request a new one.
        </AuthAlert>
      ) : null}
    </AuthShell>
  );
}
